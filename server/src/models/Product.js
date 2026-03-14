const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  uom: { type: DataTypes.STRING, defaultValue: 'Units' },
  costPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  salePrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  minStockLevel: { type: DataTypes.INTEGER, defaultValue: 0 },
  reorderQty: { type: DataTypes.INTEGER, defaultValue: 0 },
  image: { type: DataTypes.STRING, defaultValue: '' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const ProductStock = sequelize.define('ProductStock', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  locationName: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 }
});

module.exports = { Product, ProductStock };
