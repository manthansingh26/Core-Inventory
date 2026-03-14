const { Sequelize } = require('./server/node_modules/sequelize');

// Create direct connection with credentials
const sequelize = new Sequelize(
  'coreinventory',
  'postgres',
  '2601',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: true
  }
);

async function directSchemaCheck() {
  try {
    console.log('🔍 Direct Schema Check...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if Users table exists
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'users'
    `);

    if (tables.length === 0) {
      console.log('❌ Users table not found');
      return;
    }

    console.log('✅ Users table found');

    // Get columns with a simpler query
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log(`\n📋 Found ${columns.length} columns:`);
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Test a simple query
    if (columns.length > 0) {
      console.log('\n🧪 Testing simple query...');
      try {
        const [count] = await sequelize.query('SELECT COUNT(*) as total FROM "Users"');
        console.log(`✅ Total users: ${count[0].total}`);
      } catch (error) {
        console.log('❌ Query failed:', error.message);
      }
    }

    console.log('\n🎯 FINAL STATUS:');
    console.log('✅ Database connection: Working');
    console.log('✅ Users table: Found');
    console.log(`✅ Column count: ${columns.length}`);
    console.log('✅ Schema connectivity: Verified');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

directSchemaCheck();
