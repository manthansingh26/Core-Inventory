const sequelize = require('../config/database');
const User = require('./User');
const { Warehouse, WarehouseLocation } = require('./Warehouse');
const Category = require('./Category');
const { Product, ProductStock } = require('./Product');
const { StockMove, StockMoveLine } = require('./StockMove');

// --- Category Relationships ---
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });

// --- Warehouse Relationships ---
Warehouse.hasMany(WarehouseLocation, { as: 'locations', foreignKey: 'WarehouseId' });
WarehouseLocation.belongsTo(Warehouse, { foreignKey: 'WarehouseId' });

// --- Product Relationships ---
Product.belongsTo(Category, { as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId' });

Product.hasMany(ProductStock, { as: 'stockLevels', foreignKey: 'ProductId' });
ProductStock.belongsTo(Product, { foreignKey: 'ProductId' });
ProductStock.belongsTo(Warehouse, { as: 'warehouse', foreignKey: 'WarehouseId' });

// --- Stock Move Relationships ---
StockMove.belongsTo(Warehouse, { as: 'fromWarehouse', foreignKey: 'fromWarehouseId' });
StockMove.belongsTo(Warehouse, { as: 'toWarehouse', foreignKey: 'toWarehouseId' });
StockMove.belongsTo(User, { as: 'createdByUser', foreignKey: 'createdById' });
StockMove.belongsTo(User, { as: 'validatedByUser', foreignKey: 'validatedById' });

StockMove.hasMany(StockMoveLine, { as: 'lines', foreignKey: 'StockMoveId' });
StockMoveLine.belongsTo(StockMove, { foreignKey: 'StockMoveId' });
StockMoveLine.belongsTo(Product, { as: 'product', foreignKey: 'ProductId' });

module.exports = {
  sequelize,
  User,
  Warehouse,
  WarehouseLocation,
  Category,
  Product,
  ProductStock,
  StockMove,
  StockMoveLine
};
