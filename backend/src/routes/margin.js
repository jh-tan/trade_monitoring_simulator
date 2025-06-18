// backend/src/routes/margin.js
const express = require('express');
const marginController = require('../controllers/marginController');

const router = express.Router();

router.get('/status/:clientId', marginController.getMarginStatus);
router.get('/status', marginController.getAllMarginStatuses);

module.exports = router;
