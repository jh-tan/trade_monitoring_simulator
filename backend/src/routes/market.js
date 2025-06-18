// backend/src/routes/market.js
const express = require('express');
const marketController = require('../controllers/marketController');
const router = express.Router();

// Get current market data for specific symbols
router.get('/data/:symbols', marketController.getMarketData);

// Get current market data for all symbols
router.get('/data', marketController.getAllMarketData);

// Force update market data for specific symbols
router.post('/update/:symbols', marketController.updateMarketData);

// Force update market data for all symbols
router.post('/update', marketController.updateAllMarketData);

// Get historical market data
router.get('/history/:symbol', marketController.getHistoricalData);

module.exports = router;
