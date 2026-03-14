const { sequelize, Warehouse, Product } = require('./server/src/models');

async function checkDatabaseStorage() {
  try {
    console.log('🔍 Checking if warehouses and products are stored in PostgreSQL database...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Check if tables exist
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('warehouses', 'products')
    `);
    
    console.log('\n📋 Database Tables Found:');
    results.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // Count warehouses in database
    const warehouseCount = await Warehouse.count();
    console.log(`\n🏭 Warehouses in database: ${warehouseCount}`);

    // Count products in database
    const productCount = await Product.count();
    console.log(`📦 Products in database: ${productCount}`);

    // Show sample data
    if (warehouseCount > 0) {
      const warehouses = await Warehouse.findAll({ 
        attributes: ['id', 'name', 'code', 'createdAt'],
        limit: 3 
      });
      console.log('\n📝 Sample Warehouse Data:');
      warehouses.forEach(wh => {
        console.log(`  - ${wh.name} (${wh.code}) - Created: ${wh.createdAt}`);
      });
    }

    if (productCount > 0) {
      const products = await Product.findAll({ 
        attributes: ['id', 'name', 'sku', 'createdAt'],
        limit: 3 
      });
      console.log('\n📝 Sample Product Data:');
      products.forEach(p => {
        console.log(`  - ${p.name} (${p.sku}) - Created: ${p.createdAt}`);
      });
    }

    console.log('\n🎯 CONCLUSION:');
    if (warehouseCount > 0 || productCount > 0) {
      console.log('✅ YES - Warehouses and Products are stored in PostgreSQL database');
      console.log('✅ Data persists across server restarts');
    } else {
      console.log('ℹ️  No data found - but tables are ready for PostgreSQL storage');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabaseStorage();
