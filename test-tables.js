const { Sequelize } = require('./server/node_modules/sequelize');

const sequelize = new Sequelize(
  'coreinventory',
  'postgres',
  '2601',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function testTables() {
  try {
    console.log('🧪 Testing database tables...\n');

    // Test warehouses table
    const [warehouseResults] = await sequelize.query('SELECT COUNT(*) as count FROM "Warehouses"');
    console.log(`🏭 Warehouses table: ${warehouseResults[0].count} records`);

    // Test products table
    const [productResults] = await sequelize.query('SELECT COUNT(*) as count FROM "Products"');
    console.log(`📦 Products table: ${productResults[0].count} records`);

    // Test users table
    const [userResults] = await sequelize.query('SELECT COUNT(*) as count FROM "Users"');
    console.log(`👥 Users table: ${userResults[0].count} records`);

    console.log('\n✅ All tables are accessible! You can now run queries in pgAdmin.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testTables();
