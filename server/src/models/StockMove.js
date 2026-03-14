const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockMove = sequelize.define('StockMove', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reference: { type: DataTypes.STRING, allowNull: false, unique: true },
  type: {
    type: DataTypes.ENUM('receipt', 'delivery', 'transfer', 'adjustment'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'waiting', 'ready', 'done', 'cancelled'),
    defaultValue: 'draft'
  },
  partner: { type: DataTypes.STRING, defaultValue: '' },
  fromLocation: { type: DataTypes.STRING, defaultValue: '' },
  toLocation: { type: DataTypes.STRING, defaultValue: '' },
  scheduledDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  validatedDate: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT, defaultValue: '' }
});

const StockMoveLine = sequelize.define('StockMoveLine', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productName: { type: DataTypes.STRING },
  sku: { type: DataTypes.STRING },
  demandQty: { type: DataTypes.INTEGER, allowNull: false },
  doneQty: { type: DataTypes.INTEGER, defaultValue: 0 },
  uom: { type: DataTypes.STRING, defaultValue: 'Units' }
});

module.exports = { StockMove, StockMoveLine };
