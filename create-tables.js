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
    logging: false
  }
);

async function createDatabaseTables() {
  try {
    console.log('🔧 Creating database tables...');
    
    // Force sync to create all tables
    await sequelize.sync({ force: true });
    
    console.log('✅ All database tables created successfully!');
    
    // List all tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created Tables:');
    results.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    await sequelize.close();
  }
}

createDatabaseTables();
