const marginCalculationService = require('../services/marginCalculationService');
const logger = require('../utils/logger');

class MarginController {
  async getMarginStatus(req, res, next) {
    try {
      const { clientId } = req.params;
      const marginStatus = await marginCalculationService.calculateMarginStatus(clientId);
      
      res.json({
        success: true,
        data: marginStatus
      });
    } catch (error) {
      logger.error('Error in getMarginStatus:', error);
      next(error);
    }
  }

  async getAllMarginStatuses(req, res, next) {
    try {
      const marginStatuses = await marginCalculationService.getAllClientsMarginStatus();
      
      res.json({
        success: true,
        data: marginStatuses
      });
    } catch (error) {
      logger.error('Error in getAllMarginStatuses:', error);
      next(error);
    }
  }
}

module.exports = new MarginController();
