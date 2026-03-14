require('dotenv').config();
const { Product, Category, Warehouse, ProductStock } = require('./src/models');
const sequelize = require('./src/config/database');

async function addLowStockProducts() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Get or create categories
    let rawMaterials = await Category.findOne({ where: { name: 'Raw Materials' } });
    if (!rawMaterials) {
      rawMaterials = await Category.create({ name: 'Raw Materials' });
    }

    let finishedGoods = await Category.findOne({ where: { name: 'Finished Goods' } });
    if (!finishedGoods) {
      finishedGoods = await Category.create({ name: 'Finished Goods' });
    }

    // Get first warehouse
    const warehouse = await Warehouse.findOne();
    if (!warehouse) {
      console.error('✗ No warehouse found. Please create a warehouse first.');
      process.exit(1);
    }

    // Products to add (low stock - below minimum level)
    const lowStockProducts = [
      {
        name: 'Stainless Steel Pipes 3 inch',
        sku: 'SS-PIP-3IN',
        description: 'Stainless steel pipes for plumbing',
        uom: 'Meters',
        costPrice: 28.00,
        salePrice: 42.00,
        minStockLevel: 80,
        reorderQty: 300,
        categoryId: rawMaterials.id,
        currentStock: 25  // Below min level of 80
      },
      {
        name: 'Hydraulic Oil 5L',
        sku: 'HYD-OIL-5L',
        description: 'Premium hydraulic oil for machinery',
        uom: 'Liters',
        costPrice: 35.00,
        salePrice: 50.00,
        minStockLevel: 60,
        reorderQty: 200,
        categoryId: rawMaterials.id,
        currentStock: 15  // Below min level of 60
      },
      {
        name: 'Safety Helmets',
        sku: 'SAF-HLM',
        description: 'Industrial safety helmets',
        uom: 'Pieces',
        costPrice: 12.00,
        salePrice: 20.00,
        minStockLevel: 100,
        reorderQty: 500,
        categoryId: finishedGoods.id,
        currentStock: 35  // Below min level of 100
      },
      {
        name: 'Welding Rods 3.2mm',
        sku: 'WLD-ROD-3.2',
        description: 'Professional welding rods',
        uom: 'KG',
        costPrice: 8.50,
        salePrice: 14.00,
        minStockLevel: 50,
        reorderQty: 250,
        categoryId: rawMaterials.id,
        currentStock: 12  // Below min level of 50
      }
    ];

    console.log('\n⚠️  Adding low stock products...\n');

    for (const productData of lowStockProducts) {
      const { currentStock, ...productInfo } = productData;
      
      // Check if product already exists
      const existing = await Product.findOne({ where: { sku: productInfo.sku } });
      
      if (existing) {
        console.log(`⚠ Product ${productInfo.sku} already exists, updating stock...`);
        
        // Update stock to low level
        const stock = await ProductStock.findOne({ 
          where: { ProductId: existing.id } 
        });
        
        if (stock) {
          await stock.update({ quantity: currentStock });
          console.log(`  → Updated stock to ${currentStock} for ${productInfo.name}`);
          console.log(`  → Min Level: ${existing.minStockLevel} (LOW STOCK)\n`);
        }
        continue;
      }

      // Create product
      const product = await Product.create(productInfo);
      
      // Create stock entry with low quantity
      await ProductStock.create({
        locationName: 'Main Stock',
        quantity: currentStock,
        ProductId: product.id,
        WarehouseId: warehouse.id
      });

      console.log(`✓ Added: ${product.name} (${product.sku}) - LOW STOCK`);
      console.log(`  → Min Level: ${product.minStockLevel}`);
      console.log(`  → Current Stock: ${currentStock} ⚠️`);
      console.log(`  → Reorder Qty: ${product.reorderQty}`);
      console.log(`  → Shortage: ${product.minStockLevel - currentStock} units\n`);
    }

    console.log('✓ Successfully added low stock products!');
    console.log('\n📊 Summary:');
    console.log(`   - 4 products added`);
    console.log(`   - All products are LOW STOCK (below minimum level)`);
    console.log(`   - Ready for testing stock filters and restock feature`);
    console.log('\n💡 Next steps:');
    console.log('   1. Go to Products page');
    console.log('   2. Click "Low Stock" filter to see these products');
    console.log('   3. Click "Restock" button to quickly update stock');
    console.log('   4. Or click "Out of Stock" to see out-of-stock items');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addLowStockProducts();
