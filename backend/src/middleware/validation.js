// backend/src/middleware/validation.js
const Joi = require('joi');
const logger = require('../utils/logger');

// Position validation schemas
const positionSchema = Joi.object({
  clientId: Joi.string().min(1).max(50).required(),
  symbol: Joi.string().min(1).max(10).uppercase().required(),
  quantity: Joi.number().integer().min(1).required(),
  costBasis: Joi.number().positive().precision(2).required()
});

const positionUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(0).optional(),
  costBasis: Joi.number().positive().precision(2).optional()
}).min(1); // At least one field must be provided

// Validation middleware functions
const validatePosition = (req, res, next) => {
  const { error, value } = positionSchema.validate(req.body);
  
  if (error) {
    logger.warn('Position validation failed:', error.details[0].message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  
  req.body = value; // Use validated and transformed data
  next();
};

const validatePositionUpdate = (req, res, next) => {
  const { error, value } = positionUpdateSchema.validate(req.body);
  
  if (error) {
    logger.warn('Position update validation failed:', error.details[0].message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  
  req.body = value; // Use validated and transformed data
  next();
};

// Client ID validation for route parameters
const validateClientId = (req, res, next) => {
  const { clientId } = req.params;
  
  const schema = Joi.string().min(1).max(50).required();
  const { error } = schema.validate(clientId);
  
  if (error) {
    logger.warn('Client ID validation failed:', error.details[0].message);
    return res.status(400).json({
      success: false,
      message: 'Invalid client ID',
      details: error.details[0].message
    });
  }
  
  next();
};

// Symbol validation for route parameters
const validateSymbol = (req, res, next) => {
  const { symbol, symbols } = req.params;
  
  if (symbol) {
    const schema = Joi.string().min(1).max(10).uppercase().required();
    const { error } = schema.validate(symbol);
    
    if (error) {
      logger.warn('Symbol validation failed:', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: 'Invalid symbol',
        details: error.details[0].message
      });
    }
  }
  
  if (symbols) {
    const symbolArray = symbols.split(',').map(s => s.trim());
    const schema = Joi.array().items(Joi.string().min(1).max(10).uppercase()).min(1).max(20);
    const { error } = schema.validate(symbolArray);
    
    if (error) {
      logger.warn('Symbols validation failed:', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: 'Invalid symbols',
        details: error.details[0].message
      });
    }
  }
  
  next();
};

// Pagination validation
const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50)
  });
  
  const { error, value } = schema.validate(req.query);
  
  if (error) {
    logger.warn('Pagination validation failed:', error.details[0].message);
    return res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters',
      details: error.details[0].message
    });
  }
  
  req.query = { ...req.query, ...value };
  next();
};

module.exports = {
  validatePosition,
  validatePositionUpdate,
  validateClientId,
  validateSymbol,
  validatePagination
};
