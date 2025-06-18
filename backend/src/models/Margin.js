const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Margin = sequelize.define('Margin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'client_id'
  },
  loanAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'loan_amount'
  },
  maintenanceMarginRate: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0.25,
    field: 'maintenance_margin_rate'
  }
}, {
  tableName: 'margins',
  timestamps: true,
  underscored: true
});

module.exports = Margin;
