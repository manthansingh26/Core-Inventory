const { Product, Category, Warehouse, ProductStock } = require('./src/models');
const sequelize = require('./src/config/database');

async function addOutOfStockProducts() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Get or create a category
    let category = await Category.findOne({ where: { name: 'Raw Materials' } });
    if (!category) {
      category = await Category.create({ name: 'Raw Materials' });
      console.log('✓ Created Raw Materials category');
    }

    // Get first warehouse
    const warehouse = await Warehouse.findOne();
    if (!warehouse) {
      console.error('✗ No warehouse found. Please create a warehouse first.');
      process.exit(1);
    }

    // Products to add (out of stock)
    const outOfStockProducts = [
      {
        name: 'Aluminum Sheets 2mm',
        sku: 'ALU-SHT-2MM',
        description: 'High-grade aluminum sheets for manufacturing',
        uom: 'Pieces',
        costPrice: 45.00,
        salePrice: 65.00,
        minStockLevel: 50,
        reorderQty: 200,
        categoryId: category.id
      },
      {
        name: 'Copper Wire 5mm',
        sku: 'COP-WIR-5MM',
        description: 'Premium copper wire for electrical work',
        uom: 'Meters',
        costPrice: 8.50,
        salePrice: 12.00,
        minStockLevel: 100,
        reorderQty: 500,
        categoryId: category.id
      },
      {
        name: 'Industrial Bolts M12',
        sku: 'BLT-M12',
        description: 'Heavy-duty industrial bolts',
        uom: 'Boxes',
        costPrice: 15.00,
        salePrice: 22.00,
        minStockLevel: 30,
        reorderQty: 150,
        categoryId: category.id
      }
    ];

    console.log('\n📦 Adding out-of-stock products...\n');

    for (const productData of outOfStockProducts) {
      // Check if product already exists
      const existing = await Product.findOne({ where: { sku: productData.sku } });
      
      if (existing) {
        console.log(`⚠ Product ${productData.sku} already exists, skipping...`);
        
        // Set stock to 0 if it exists
        const stock = await ProductStock.findOne({ 
          where: { ProductId: existing.id } 
        });
        
        if (stock) {
          await stock.update({ quantity: 0 });
          console.log(`  → Set stock to 0 for ${productData.name}`);
        }
        continue;
      }

      // Create product
      const product = await Product.create(productData);
      
      // Create stock entry with 0 quantity (out of stock)
      await ProductStock.create({
        locationName: 'Main Stock',
        quantity: 0,
        ProductId: product.id,
        WarehouseId: warehouse.id
      });

      console.log(`✓ Added: ${product.name} (${product.sku}) - OUT OF STOCK`);
      console.log(`  → Min Level: ${product.minStockLevel}`);
      console.log(`  → Reorder Qty: ${product.reorderQty}`);
      console.log(`  → Current Stock: 0\n`);
    }

    console.log('✓ Successfully added out-of-stock products!');
    console.log('\n📊 Summary:');
    console.log(`   - 3 products added`);
    console.log(`   - All products are OUT OF STOCK (quantity: 0)`);
    console.log(`   - Ready for testing stock filters and restock feature`);
    console.log('\n💡 Next steps:');
    console.log('   1. Go to Products page');
    console.log('   2. Click "Out of Stock" filter to see these products');
    console.log('   3. Click "Restock" button to quickly update stock');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

addOutOfStockProducts();
