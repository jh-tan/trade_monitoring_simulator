// backend/src/services/websocketService.js
const logger = require('../utils/logger');
const marginCalculationService = require('./marginCalculationService');
const marketDataService = require('./marketDataService');

class WebSocketService {
  constructor() {
    this.io = null;
    this.clients = new Map();
    this.marketDataInterval = null;
    this.marginCheckInterval = null;
  }

  initialize(io) {
    this.io = io;
    this.setupEventHandlers();
    this.startPeriodicUpdates();
    logger.info('WebSocket service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.clients.set(socket.id, { socket, clientId: null });

      // Handle client registration
      socket.on('register', (data) => {
        const { clientId } = data;
        if (clientId) {
          this.clients.set(socket.id, { socket, clientId });
          socket.join(`client_${clientId}`);
          logger.info(`Client ${clientId} registered with socket ${socket.id}`);

          // Send initial margin status
          this.sendMarginStatusToClient(clientId);
        }
      });

      socket.on('deregister', (clientId) => {
        const clientInfo = this.clients.get(socket.id);

        if (clientInfo && clientInfo.clientId === clientId) {
          socket.leave(`client_${clientId}`);
          this.clients.set(socket.id, { socket, clientId: null });
          logger.info(`Client ${clientId} deregistered from socket ${socket.id}`);
        } else {
          logger.warn(`Deregister attempt with mismatched or missing clientId on socket ${socket.id}`);
        }
      });

      // Handle subscription to market data
      socket.on('subscribe_market', (data) => {
        const { symbols } = data;
        if (symbols && Array.isArray(symbols)) {
          symbols.forEach(symbol => {
            socket.join(`market_${symbol}`);
          });
          logger.info(`Socket ${socket.id} subscribed to market data for: ${symbols.join(', ')}`);
        }
      });

      // Handle unsubscription from market data
      socket.on('unsubscribe_market', (data) => {
        const { symbols } = data;
        if (symbols && Array.isArray(symbols)) {
          symbols.forEach(symbol => {
            socket.leave(`market_${symbol}`);
          });
          logger.info(`Socket ${socket.id} unsubscribed from market data for: ${symbols.join(', ')}`);
        }
      });

      // Handle manual margin check request
      socket.on('check_margin', async (data) => {
        const { clientId } = data;
        if (clientId) {
          try {
            const marginStatus = await marginCalculationService.calculateMarginStatus(clientId);
            socket.emit('margin_status', marginStatus);
          } catch (error) {
            logger.error(`Error checking margin for client ${clientId}:`, error);
            socket.emit('error', { message: 'Failed to check margin status' });
          }
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        this.clients.delete(socket.id);
      });
    });
  }

  startPeriodicUpdates() {
    // Update market data every 70 seconds
    // 70 seconds because of free API limit
    this.marketDataInterval = setInterval(async () => {
      try {
        await this.updateAndBroadcastMarketData();
      } catch (error) {
        logger.error('Error in periodic market data update:', error);
      }
    }, 70000);

    // Check margin status every 60 seconds
    this.marginCheckInterval = setInterval(async () => {
      try {
        await this.checkAndBroadcastMarginStatuses();
      } catch (error) {
        logger.error('Error in periodic margin check:', error);
      }
    }, 60000);

    logger.info('Periodic updates started');
  }

  async updateAndBroadcastMarketData() {
    try {
      // Get all unique symbols from positions
      const Position = require('../models/Position');
      const positions = await Position.findAll({
        attributes: ['symbol'],
        group: ['symbol']
      });

      const symbols = positions.map(p => p.symbol);

      if (symbols.length === 0) {
        return;
      }

      // Update market data
      const marketData = await marketDataService.updateMarketData(symbols);
      // Broadcast to subscribed clients
      /* marketData.forEach(data => { */
      /*   this.io.emit('market_update', { */
      /*     symbol: data.symbol, */
      /*     price: data.price, */
      /*     timestamp: data.timestamp */
      /*   }); */
      /* }); */

      this.io.emit('market_update', marketData)

      logger.info(`Broadcast market data for ${symbols.length} symbols`);
    } catch (error) {
      logger.error('Error updating and broadcasting market data:', error);
    }
  }

  async checkAndBroadcastMarginStatuses() {
    try {
      const marginStatuses = await marginCalculationService.getAllClientsMarginStatus();

      marginStatuses.forEach(status => {
        // Send to specific client
        this.io.to(`client_${status.clientId}`).emit('margin_status', status);

        // Send margin call alerts if triggered
        if (status.marginCallTriggered) {
          this.io.to(`client_${status.clientId}`).emit('margin_call_alert', {
            clientId: status.clientId,
            marginShortfall: status.marginShortfall,
            timestamp: status.calculatedAt
          });

          logger.warn(`Margin call alert sent to client ${status.clientId}`);
        }
      });

      logger.debug(`Checked margin status for ${marginStatuses.length} clients`);
    } catch (error) {
      logger.error('Error checking and broadcasting margin statuses:', error);
    }
  }

  async sendMarginStatusToClient(clientId) {
    try {
      const marginStatus = await marginCalculationService.calculateMarginStatus(clientId);
      this.io.to(`client_${clientId}`).emit('margin_status', marginStatus);
    } catch (error) {
      logger.error(`Error sending initial margin status to client ${clientId}:`, error);
    }
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  broadcastToClient(clientId, event, data) {
    this.io.to(`client_${clientId}`).emit(event, data);
  }

  broadcastToSymbolSubscribers(symbol, event, data) {
    this.io.to(`market_${symbol}`).emit(event, data);
  }

  getConnectedClientsCount() {
    return this.clients.size;
  }

  getClientsByClientId(clientId) {
    const clientSockets = [];
    this.clients.forEach((client, socketId) => {
      if (client.clientId === clientId) {
        clientSockets.push(socketId);
      }
    });
    return clientSockets;
  }

  shutdown() {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
      this.marketDataInterval = null;
    }

    if (this.marginCheckInterval) {
      clearInterval(this.marginCheckInterval);
      this.marginCheckInterval = null;
    }

    this.clients.clear();
    logger.info('WebSocket service shut down');
  }
}

module.exports = new WebSocketService();
