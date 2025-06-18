const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MarketData = sequelize.define('MarketData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  symbol: {
    type: DataTypes.STRING(10),
    unique: true
  },
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'current_price'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  source: {
    type: DataTypes.STRING(50),
    defaultValue: 'api'
  }
}, {
  tableName: 'market_data',
  timestamps: false,
  underscored: true
});

module.exports = MarketData;
