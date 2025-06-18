// backend/src/server.js (Updated)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = require('./app');
const logger = require('./utils/logger');
const { initializeDatabase } = require('./config/database');
const websocketService = require('./services/websocketService');
const schedulerService = require('./services/schedulerService');

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  pingTimeout: parseInt(process.env.WS_HEARTBEAT_TIMEOUT) || 60000,
  pingInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000
});

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize WebSocket service
    websocketService.initialize(io);
    
    // Initialize scheduler service
    schedulerService.initialize();
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
};

// Graceful shutdown handler
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, starting graceful shutdown...');
  
  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Shutdown services
    schedulerService.shutdown();
    websocketService.shutdown();
    
    // Close database connection
    const { sequelize } = require('./config/database');
    sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    }).catch((error) => {
      logger.error('Error closing database connection:', error);
      process.exit(1);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    logger.info('Database connected successfully');
    
    await initializeServices();
    
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      
      // Log service status
      console.log(schedulerService)
      /* const taskStatus = schedulerService.getTaskStatus(); */
      /* logger.info('Scheduler tasks:', taskStatus); */
      logger.info(`WebSocket clients connected: ${websocketService.getConnectedClientsCount()}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
