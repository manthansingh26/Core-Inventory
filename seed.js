const { User, Warehouse } = require('./server/src/models');
const sequelize = require('./server/src/config/database');

// Set database connection
sequelize.options.host = 'localhost';
sequelize.options.port = 5432;
sequelize.options.database = 'coreinventory';
sequelize.options.username = 'postgres';
sequelize.options.password = '2601';

async function seedData() {
  try {
    await sequelize.sync({ force: true });
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    });
    
    // Create manager user
    const manager = await User.create({
      name: 'Manager User',
      email: 'manager@test.com',
      password: 'manager123',
      role: 'manager'
    });
    
    // Create staff user
    const staff = await User.create({
      name: 'Staff User',
      email: 'staff@test.com',
      password: 'staff123',
      role: 'staff'
    });
    
    // Create warehouses
    const warehouse1 = await Warehouse.create({
      name: 'Main Warehouse',
      code: 'WH001',
      address: '123 Main St, City, State'
    });
    
    const warehouse2 = await Warehouse.create({
      name: 'Secondary Warehouse',
      code: 'WH002',
      address: '456 Oak Ave, City, State'
    });
    
    const warehouse3 = await Warehouse.create({
      name: 'Distribution Center',
      code: 'WH003',
      address: '789 Industrial Blvd, City, State'
    });
    
    console.log('✅ Database seeded successfully!');
    console.log('Users created:');
    console.log('- Admin: admin@test.com / admin123');
    console.log('- Manager: manager@test.com / manager123');
    console.log('- Staff: staff@test.com / staff123');
    console.log('Warehouses created:');
    console.log('- Main Warehouse (WH001)');
    console.log('- Secondary Warehouse (WH002)');
    console.log('- Distribution Center (WH003)');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await sequelize.close();
  }
}

seedData();
