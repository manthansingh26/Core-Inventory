const { Product, ProductStock } = require('../models');

/**
 * Update stock levels when a move is validated.
 */
async function updateStock(lines, type, move) {
  for (const line of lines) {
    if (!line.ProductId) continue;

    if (type === 'receipt') {
      let stock = await ProductStock.findOne({
        where: { ProductId: line.ProductId, WarehouseId: move.toWarehouseId, locationName: move.toLocation || 'Main Stock' }
      });
      if (stock) {
        stock.quantity += line.doneQty;
        await stock.save();
      } else {
        await ProductStock.create({
          ProductId: line.ProductId,
          WarehouseId: move.toWarehouseId,
          locationName: move.toLocation || 'Main Stock',
          quantity: line.doneQty
        });
      }
    } else if (type === 'delivery') {
      let stock = await ProductStock.findOne({
        where: { ProductId: line.ProductId, WarehouseId: move.fromWarehouseId, locationName: move.fromLocation || 'Main Stock' }
      });
      if (stock) {
        stock.quantity = Math.max(0, stock.quantity - line.doneQty);
        await stock.save();
      }
    } else if (type === 'transfer') {
      // Remove from source
      let fromStock = await ProductStock.findOne({
        where: { ProductId: line.ProductId, WarehouseId: move.fromWarehouseId, locationName: move.fromLocation || 'Main Stock' }
      });
      if (fromStock) {
        fromStock.quantity = Math.max(0, fromStock.quantity - line.doneQty);
        await fromStock.save();
      }
      // Add to dest
      let toStock = await ProductStock.findOne({
        where: { ProductId: line.ProductId, WarehouseId: move.toWarehouseId, locationName: move.toLocation || 'Main Stock' }
      });
      if (toStock) {
        toStock.quantity += line.doneQty;
        await toStock.save();
      } else {
        await ProductStock.create({
          ProductId: line.ProductId,
          WarehouseId: move.toWarehouseId,
          locationName: move.toLocation || 'Main Stock',
          quantity: line.doneQty
        });
      }
    } else if (type === 'adjustment') {
      let stock = await ProductStock.findOne({
        where: { ProductId: line.ProductId, WarehouseId: move.toWarehouseId, locationName: move.toLocation || 'Main Stock' }
      });
      if (stock) {
        stock.quantity = line.doneQty; // Adjust directly sets qty
        await stock.save();
      } else {
        await ProductStock.create({
          ProductId: line.ProductId,
          WarehouseId: move.toWarehouseId,
          locationName: move.toLocation || 'Main Stock',
          quantity: line.doneQty
        });
      }
    }
  }
}

module.exports = { updateStock };
