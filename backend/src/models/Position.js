const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Position = sequelize.define('Position', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'client_id'
  },
  symbol: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  costBasis: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'cost_basis'
  }
}, {
  tableName: 'positions',
  timestamps: true,
  underscored: true
});

module.exports = Position;
