const Position = require('../models/Position');
const Margin = require('../models/Margin');
const MarketData = require('../models/MarketData');
const logger = require('../utils/logger');

class MarginCalculationService {
  constructor() {
    this.MMR = 0.25; // 25% Maintenance Margin Rate
  }

  async calculateMarginStatus(clientId) {
    try {
      // Get client positions
      const positions = await Position.findAll({
        where: { clientId }
      });

      if (positions.length === 0) {
        throw new Error('No positions found for client');
      }

      // Get client margin info
      const margin = await Margin.findOne({
        where: { clientId }
      });

      if (!margin) {
        throw new Error('No margin account found for client');
      }

      // Get current market prices
      const symbols = positions.map(p => p.symbol);
      const marketData = await MarketData.findAll({
        where: { symbol: symbols },
        order: [['timestamp', 'DESC']]
      });

      const priceMap = {};
      marketData.forEach(data => {
        if (!priceMap[data.symbol] || data.timestamp > priceMap[data.symbol].timestamp) {
          priceMap[data.symbol] = {
            price: parseFloat(data.currentPrice),
            timestamp: data.timestamp
          };
        }
      });

      // Calculate portfolio metrics
      let portfolioValue = 0;
      const positionsWithPrices = positions.map(position => {
        const currentPrice = priceMap[position.symbol]?.price || position.costBasis;
        const marketValue = position.quantity * currentPrice;
        const unrealizedPnL = marketValue - (position.quantity * position.costBasis);
        
        portfolioValue += marketValue;

        return {
          id: position.id,
          symbol: position.symbol,
          quantity: position.quantity,
          costBasis: parseFloat(position.costBasis),
          currentPrice: currentPrice,
          marketValue: marketValue,
          unrealizedPnL: unrealizedPnL
        };
      });

      // Calculate margin metrics
      const loanAmount = parseFloat(margin.loanAmount);
      const netEquity = portfolioValue - loanAmount;
      const totalMarginRequirement = this.MMR * portfolioValue;
      const marginShortfall = totalMarginRequirement - netEquity;
      const marginCallTriggered = marginShortfall > 0;

      const result = {
        clientId,
        portfolioValue: portfolioValue,
        loanAmount: loanAmount,
        netEquity: netEquity,
        totalMarginRequirement: totalMarginRequirement,
        marginShortfall: marginShortfall,
        marginCallTriggered: marginCallTriggered,
        maintenanceMarginRate: this.MMR,
        positions: positionsWithPrices,
        calculatedAt: new Date()
      };

      logger.info(`Calculated margin status for client ${clientId}: ${marginCallTriggered ? 'MARGIN CALL' : 'OK'}`);
      
      return result;
    } catch (error) {
      logger.error(`Failed to calculate margin status for ${clientId}:`, error);
      throw error;
    }
  }

  async getAllClientsMarginStatus() {
    try {
      const margins = await Margin.findAll();
      const promises = margins.map(margin => 
        this.calculateMarginStatus(margin.clientId)
      );

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      logger.error('Failed to calculate margin status for all clients:', error);
      throw error;
    }
  }
}

module.exports = new MarginCalculationService();
