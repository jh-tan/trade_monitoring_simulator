// backend/src/controllers/marketController.js
const marketDataService = require('../services/marketDataService');
const logger = require('../utils/logger');

class MarketController {
  async getMarketData(req, res, next) {
    try {
      const { symbols } = req.params;
      const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());
      
      const marketData = await marketDataService.getLatestMarketData(symbolArray);
      
      res.json({
        success: true,
        data: marketData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getMarketData:', error);
      next(error);
    }
  }

  async getAllMarketData(req, res, next) {
    try {
      const marketData = await marketDataService.getLatestMarketData();
      
      res.json({
        success: true,
        data: marketData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getAllMarketData:', error);
      next(error);
    }
  }

  async updateMarketData(req, res, next) {
    try {
      const { symbols } = req.params;
      const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());
      
      const updatedData = await marketDataService.updateMarketData(symbolArray);
      
      res.json({
        success: true,
        message: `Market data updated for ${symbolArray.length} symbols`,
        data: updatedData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in updateMarketData:', error);
      next(error);
    }
  }

  async updateAllMarketData(req, res, next) {
    try {
      // Get all unique symbols from positions
      const Position = require('../models/Position');
      const positions = await Position.findAll({
        attributes: ['symbol'],
        group: ['symbol']
      });
      
      const symbols = positions.map(p => p.symbol);
      
      if (symbols.length === 0) {
        return res.json({
          success: true,
          message: 'No symbols found to update',
          data: [],
          timestamp: new Date().toISOString()
        });
      }

      const updatedData = await marketDataService.updateMarketData(symbols);
      
      res.json({
        success: true,
        message: `Market data updated for ${symbols.length} symbols`,
        data: updatedData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in updateAllMarketData:', error);
      next(error);
    }
  }

  async getHistoricalData(req, res, next) {
    try {
      const { symbol } = req.params;
      const { days = 30 } = req.query;
      
      const MarketData = require('../models/MarketData');
      const { Op } = require('sequelize');
      
      const historicalData = await MarketData.findAll({
        where: {
          symbol: symbol.toUpperCase(),
          timestamp: {
            [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          }
        },
        order: [['timestamp', 'ASC']],
        attributes: ['currentPrice', 'timestamp']
      });

      const formattedData = historicalData.map(item => ({
        price: parseFloat(item.currentPrice),
        timestamp: item.timestamp
      }));

      res.json({
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          period: `${days} days`,
          prices: formattedData
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getHistoricalData:', error);
      next(error);
    }
  }
}

module.exports = new MarketController();
