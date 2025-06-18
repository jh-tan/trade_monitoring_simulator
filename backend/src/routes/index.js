const express = require('express');
const marketRoutes = require('./market');
const positionRoutes = require('./positions');
const marginRoutes = require('./margin');

const router = express.Router();

router.use('/market', marketRoutes);
router.use('/positions', positionRoutes);
router.use('/margin', marginRoutes);

module.exports = router;
