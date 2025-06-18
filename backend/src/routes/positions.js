// backend/src/routes/positions.js
const express = require('express');
const positionController = require('../controllers/positionController');
const { validatePosition, validatePositionUpdate } = require('../middleware/validation');
const router = express.Router();

// Get all positions for a specific client
router.get('/client/:clientId', positionController.getClientPositions);

// Get all positions
router.get('/', positionController.getAllPositions);

// Get specific position by ID
router.get('/:id', positionController.getPositionById);

// Create new position
router.post('/', validatePosition, positionController.createPosition);

// Update existing position
router.put('/:id', validatePositionUpdate, positionController.updatePosition);

// Delete position
router.delete('/:id', positionController.deletePosition);

// Get positions with current market values
router.get('/client/:clientId/with-market-data', positionController.getClientPositionsWithMarketData);

module.exports = router;
