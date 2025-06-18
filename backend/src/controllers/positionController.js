// backend/src/controllers/positionController.js
const Position = require('../models/Position');
const MarketData = require('../models/MarketData');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class PositionController {
  async getClientPositions(req, res, next) {
    try {
      const { clientId } = req.params;
      
      const positions = await Position.findAll({
        where: { clientId },
        order: [['createdAt', 'DESC']]
      });

      const formattedPositions = positions.map(position => ({
        id: position.id,
        clientId: position.clientId,
        symbol: position.symbol,
        quantity: position.quantity,
        costBasis: parseFloat(position.costBasis),
        createdAt: position.createdAt,
        updatedAt: position.updatedAt
      }));

      res.json({
        success: true,
        data: formattedPositions,
        count: formattedPositions.length
      });
    } catch (error) {
      logger.error('Error in getClientPositions:', error);
      next(error);
    }
  }

  async getAllPositions(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: positions } = await Position.findAndCountAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      const formattedPositions = positions.map(position => ({
        id: position.id,
        clientId: position.clientId,
        symbol: position.symbol,
        quantity: position.quantity,
        costBasis: parseFloat(position.costBasis),
        createdAt: position.createdAt,
        updatedAt: position.updatedAt
      }));

      res.json({
        success: true,
        data: formattedPositions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error in getAllPositions:', error);
      next(error);
    }
  }

  async getPositionById(req, res, next) {
    try {
      const { id } = req.params;
      
      const position = await Position.findByPk(id);
      
      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'Position not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: position.id,
          clientId: position.clientId,
          symbol: position.symbol,
          quantity: position.quantity,
          costBasis: parseFloat(position.costBasis),
          createdAt: position.createdAt,
          updatedAt: position.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error in getPositionById:', error);
      next(error);
    }
  }

  async createPosition(req, res, next) {
    try {
      const { clientId, symbol, quantity, costBasis } = req.body;
      
      // Check if position already exists for this client and symbol
      const existingPosition = await Position.findOne({
        where: { clientId, symbol: symbol.toUpperCase() }
      });

      if (existingPosition) {
        // Update existing position (average cost basis)
        const totalShares = existingPosition.quantity + quantity;
        const totalCost = (existingPosition.quantity * parseFloat(existingPosition.costBasis)) + 
                         (quantity * costBasis);
        const newCostBasis = totalCost / totalShares;

        existingPosition.quantity = totalShares;
        existingPosition.costBasis = newCostBasis;
        await existingPosition.save();

        logger.info(`Updated existing position for ${clientId} - ${symbol}`);

        return res.status(200).json({
          success: true,
          message: 'Position updated successfully',
          data: {
            id: existingPosition.id,
            clientId: existingPosition.clientId,
            symbol: existingPosition.symbol,
            quantity: existingPosition.quantity,
            costBasis: parseFloat(existingPosition.costBasis),
            createdAt: existingPosition.createdAt,
            updatedAt: existingPosition.updatedAt
          }
        });
      }

      // Create new position
      const position = await Position.create({
        clientId,
        symbol: symbol.toUpperCase(),
        quantity,
        costBasis
      });

      logger.info(`Created new position for ${clientId} - ${symbol}`);

      res.status(201).json({
        success: true,
        message: 'Position created successfully',
        data: {
          id: position.id,
          clientId: position.clientId,
          symbol: position.symbol,
          quantity: position.quantity,
          costBasis: parseFloat(position.costBasis),
          createdAt: position.createdAt,
          updatedAt: position.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error in createPosition:', error);
      next(error);
    }
  }

  async updatePosition(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity, costBasis } = req.body;
      
      const position = await Position.findByPk(id);
      
      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'Position not found'
        });
      }

      // Update fields if provided
      if (quantity !== undefined) position.quantity = quantity;
      if (costBasis !== undefined) position.costBasis = costBasis;

      await position.save();

      logger.info(`Updated position ${id} for ${position.clientId} - ${position.symbol}`);

      res.json({
        success: true,
        message: 'Position updated successfully',
        data: {
          id: position.id,
          clientId: position.clientId,
          symbol: position.symbol,
          quantity: position.quantity,
          costBasis: parseFloat(position.costBasis),
          createdAt: position.createdAt,
          updatedAt: position.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error in updatePosition:', error);
      next(error);
    }
  }

  async deletePosition(req, res, next) {
    try {
      const { id } = req.params;
      
      const position = await Position.findByPk(id);
      
      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'Position not found'
        });
      }

      await position.destroy();

      logger.info(`Deleted position ${id} for ${position.clientId} - ${position.symbol}`);

      res.json({
        success: true,
        message: 'Position deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deletePosition:', error);
      next(error);
    }
  }

  async getClientPositionsWithMarketData(req, res, next) {
    try {
      const { clientId } = req.params;
      
      const positions = await Position.findAll({
        where: { clientId },
        order: [['createdAt', 'DESC']]
      });

      if (positions.length === 0) {
        return res.json({
          success: true,
          data: [],
          count: 0
        });
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

      // Combine positions with market data
      const positionsWithMarketData = positions.map(position => {
        const currentPrice = priceMap[position.symbol]?.price || parseFloat(position.costBasis);
        const marketValue = position.quantity * currentPrice;
        const unrealizedPnL = marketValue - (position.quantity * parseFloat(position.costBasis));
        const unrealizedPnLPercent = (unrealizedPnL / (position.quantity * parseFloat(position.costBasis))) * 100;

        return {
          id: position.id,
          clientId: position.clientId,
          symbol: position.symbol,
          quantity: position.quantity,
          costBasis: parseFloat(position.costBasis),
          currentPrice: currentPrice,
          marketValue: marketValue,
          unrealizedPnL: unrealizedPnL,
          unrealizedPnLPercent: unrealizedPnLPercent,
          priceTimestamp: priceMap[position.symbol]?.timestamp || null,
          createdAt: position.createdAt,
          updatedAt: position.updatedAt
        };
      });

      res.json({
        success: true,
        data: positionsWithMarketData,
        count: positionsWithMarketData.length
      });
    } catch (error) {
      logger.error('Error in getClientPositionsWithMarketData:', error);
      next(error);
    }
  }
}

module.exports = new PositionController();
