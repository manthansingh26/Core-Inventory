const Product = require('../models/Product');

/**
 * Update stock levels when a move is validated.
 * @param {Array} lines - move lines with product, doneQty
 * @param {String} type - 'receipt' | 'delivery' | 'transfer' | 'adjustment'
 * @param {Object} move - the full move document
 */
async function updateStock(lines, type, move) {
  for (const line of lines) {
    const product = await Product.findById(line.product);
    if (!product) continue;

    if (type === 'receipt') {
      // Add to toWarehouse / toLocation
      const idx = product.stockLevels.findIndex(
        s => s.warehouse?.toString() === move.toWarehouse?.toString() && s.locationName === move.toLocation
      );
      if (idx > -1) {
        product.stockLevels[idx].quantity += line.doneQty;
      } else {
        product.stockLevels.push({ warehouse: move.toWarehouse, locationName: move.toLocation || 'Main Stock', quantity: line.doneQty });
      }
    } else if (type === 'delivery') {
      // Remove from fromWarehouse / fromLocation
      const idx = product.stockLevels.findIndex(
        s => s.warehouse?.toString() === move.fromWarehouse?.toString() && s.locationName === move.fromLocation
      );
      if (idx > -1) {
        product.stockLevels[idx].quantity = Math.max(0, product.stockLevels[idx].quantity - line.doneQty);
      }
    } else if (type === 'transfer') {
      // Remove from source
      const fromIdx = product.stockLevels.findIndex(
        s => s.warehouse?.toString() === move.fromWarehouse?.toString() && s.locationName === move.fromLocation
      );
      if (fromIdx > -1) {
        product.stockLevels[fromIdx].quantity = Math.max(0, product.stockLevels[fromIdx].quantity - line.doneQty);
      }
      // Add to destination
      const toIdx = product.stockLevels.findIndex(
        s => s.warehouse?.toString() === move.toWarehouse?.toString() && s.locationName === move.toLocation
      );
      if (toIdx > -1) {
        product.stockLevels[toIdx].quantity += line.doneQty;
      } else {
        product.stockLevels.push({ warehouse: move.toWarehouse, locationName: move.toLocation || 'Main Stock', quantity: line.doneQty });
      }
    } else if (type === 'adjustment') {
      // Set quantity directly
      const idx = product.stockLevels.findIndex(
        s => s.warehouse?.toString() === move.toWarehouse?.toString() && s.locationName === move.toLocation
      );
      if (idx > -1) {
        product.stockLevels[idx].quantity = line.doneQty;
      } else {
        product.stockLevels.push({ warehouse: move.toWarehouse, locationName: move.toLocation || 'Main Stock', quantity: line.doneQty });
      }
    }

    await product.save();
  }
}

module.exports = { updateStock };
