// backend/src/services/schedulerService.js
const cron = require('node-cron');
const logger = require('../utils/logger');
const marketDataService = require('./marketDataService');
const marginCalculationService = require('./marginCalculationService');
const websocketService = require('./websocketService');

class SchedulerService {
  constructor() {
    this.tasks = [];
  }

  initialize() {
    /* this.setupMarketDataUpdates(); */
    this.setupMarginChecks();
    this.setupDatabaseCleanup();
    logger.info('Scheduler service initialized');
  }

  setupMarketDataUpdates() {
    // Update market data every 5 minutes during market hours (9 AM - 4 PM EST, Mon-Fri)
    const marketDataTask = cron.schedule('*/5 9-16 * * 1-5', async () => {
      try {
        await this.updateMarketData();
      } catch (error) {
        logger.error('Scheduled market data update failed:', error);
      }
    }, {
      scheduled: false,
      timezone: "America/New_York"
    });

    // More frequent updates during peak trading hours (9:30 AM - 4 PM EST)
    const frequentUpdateTask = cron.schedule('*/1 9-16 * * 1-5', async () => {
      try {
        await this.updateMarketData();
      } catch (error) {
        logger.error('Frequent market data update failed:', error);
      }
    }, {
      scheduled: false,
      timezone: "America/New_York"
    });

    this.tasks.push({ name: 'market-data-updates', task: marketDataTask });
    this.tasks.push({ name: 'frequent-market-updates', task: frequentUpdateTask });

    // Start tasks based on environment
    if (process.env.ENABLE_MARKET_UPDATES !== 'false') {
      marketDataTask.start();
      frequentUpdateTask.start();
      logger.info('Market data update tasks started');
    }
  }

  setupMarginChecks() {
    // Check margin status every 2 minutes during market hours
    const marginCheckTask = cron.schedule('*/2 9-16 * * 1-5', async () => {
      try {
        await this.performMarginChecks();
      } catch (error) {
        logger.error('Scheduled margin check failed:', error);
      }
    }, {
      scheduled: false,
      timezone: "America/New_York"
    });

    // After-hours margin check (once every hour)
    const afterHoursMarginTask = cron.schedule('0 17-8 * * *', async () => {
      try {
        await this.performMarginChecks();
      } catch (error) {
        logger.error('After-hours margin check failed:', error);
      }
    }, {
      scheduled: false,
      timezone: "America/New_York"
    });

    this.tasks.push({ name: 'margin-checks', task: marginCheckTask });
    this.tasks.push({ name: 'after-hours-margin', task: afterHoursMarginTask });

    if (process.env.ENABLE_MARGIN_CHECKS !== 'false') {
      marginCheckTask.start();
      afterHoursMarginTask.start();
      logger.info('Margin check tasks started');
    }
  }

  setupDatabaseCleanup() {
    // Clean old market data daily at 2 AM
    const cleanupTask = cron.schedule('0 2 * * *', async () => {
      try {
        await this.cleanupOldMarketData();
      } catch (error) {
        logger.error('Database cleanup failed:', error);
      }
    }, {
      scheduled: false
    });

    this.tasks.push({ name: 'database-cleanup', task: cleanupTask });

    if (process.env.ENABLE_DATABASE_CLEANUP !== 'false') {
      cleanupTask.start();
      logger.info('Database cleanup task started');
    }
  }

  async updateMarketData() {
    try {
      const Position = require('../models/Position');
      
      // Get all unique symbols from positions
      const positions = await Position.findAll({
        attributes: ['symbol'],
        group: ['symbol']
      });

      const symbols = positions.map(p => p.symbol);
      
      if (symbols.length === 0) {
        logger.debug('No symbols to update');
        return;
      }

      const updatedData = await marketDataService.updateMarketData(symbols);
      
      // Broadcast updates via WebSocket if available
      if (websocketService.io) {
        updatedData.forEach(data => {
          websocketService.broadcastToSymbolSubscribers(data.symbol, 'market_update', {
            symbol: data.symbol,
            price: data.price,
            timestamp: data.timestamp
          });
        });
      }

      logger.info(`Scheduled update completed for ${symbols.length} symbols`);
    } catch (error) {
      logger.error('Error in scheduled market data update:', error);
      throw error;
    }
  }

  async performMarginChecks() {
    try {
      const marginStatuses = await marginCalculationService.getAllClientsMarginStatus();
      
      let marginCallCount = 0;
      
      marginStatuses.forEach(status => {
        if (status.marginCallTriggered) {
          marginCallCount++;
          
          // Send WebSocket notifications
          if (websocketService.io) {
            websocketService.broadcastToClient(status.clientId, 'margin_call_alert', {
              clientId: status.clientId,
              marginShortfall: status.marginShortfall,
              portfolioValue: status.portfolioValue,
              netEquity: status.netEquity,
              timestamp: status.calculatedAt
            });
            
            websocketService.broadcastToClient(status.clientId, 'margin_status', status);
          }
          
          logger.warn(`Margin call triggered for client ${status.clientId} - Shortfall: $${status.marginShortfall.toFixed(2)}`);
        }
      });

      if (marginCallCount > 0) {
        logger.warn(`Margin checks completed: ${marginCallCount} margin calls out of ${marginStatuses.length} clients`);
      } else {
        logger.info(`Margin checks completed: All ${marginStatuses.length} clients within margin requirements`);
      }
      
    } catch (error) {
      logger.error('Error in scheduled margin checks:', error);
      throw error;
    }
  }

  async cleanupOldMarketData() {
    try {
      const MarketData = require('../models/MarketData');
      const { Op } = require('sequelize');
      
      // Delete market data older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const deletedCount = await MarketData.destroy({
        where: {
          timestamp: {
            [Op.lt]: thirtyDaysAgo
          }
        }
      });

      logger.info(`Database cleanup completed: Removed ${deletedCount} old market data records`);
    } catch (error) {
      logger.error('Error in database cleanup:', error);
      throw error;
    }
  }

  // Manual trigger methods for testing
  async triggerMarketDataUpdate() {
    logger.info('Manually triggering market data update');
    await this.updateMarketData();
  }

  async triggerMarginCheck() {
    logger.info('Manually triggering margin check');
    await this.performMarginChecks();
  }

  async triggerDatabaseCleanup() {
    logger.info('Manually triggering database cleanup');
    await this.cleanupOldMarketData();
  }

  // Task management
  getTaskStatus() {
    console.log(this.tasks[0])
    return this.tasks.map(({ name, task }) => ({
      name,
      running: task.getStatus() === 'scheduled'
    }));
  }

  stopTask(taskName) {
    const taskInfo = this.tasks.find(t => t.name === taskName);
    if (taskInfo) {
      taskInfo.task.stop();
      logger.info(`Task ${taskName} stopped`);
      return true;
    }
    return false;
  }

  startTask(taskName) {
    const taskInfo = this.tasks.find(t => t.name === taskName);
    if (taskInfo) {
      taskInfo.task.start();
      logger.info(`Task ${taskName} started`);
      return true;
    }
    return false;
  }

  stopAllTasks() {
    this.tasks.forEach(({ name, task }) => {
      task.stop();
      logger.info(`Task ${name} stopped`);
    });
  }

  shutdown() {
    this.stopAllTasks();
    logger.info('Scheduler service shut down');
  }
}

module.exports = new SchedulerService();
