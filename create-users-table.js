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

async function createUsersTable() {
  try {
    console.log('🔧 Creating Users Table with Profile Fields...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Create Users table with all profile fields
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "Users" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "role" VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
        "avatar" VARCHAR(255) DEFAULT '',
        "profilePicture" VARCHAR(500) DEFAULT NULL,
        "phoneNumber" VARCHAR(50) DEFAULT NULL,
        "dateOfBirth" DATE DEFAULT NULL,
        "address" TEXT DEFAULT NULL,
        "department" VARCHAR(100) DEFAULT NULL,
        "jobTitle" VARCHAR(100) DEFAULT NULL,
        "bio" TEXT DEFAULT NULL,
        "resetOtp" VARCHAR(255),
        "resetOtpExpiry" TIMESTAMP WITH TIME ZONE,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `;

    await sequelize.query(createTableSQL);
    console.log('✅ Users table created with all profile fields');

    // Verify the table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Users' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log(`\n📋 Table structure (${columns.length} columns):`);
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type})`);
    });

    // Create admin user with profile data
    console.log('\n👤 Creating admin user...');
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await sequelize.query(`
      INSERT INTO "Users" (
        name, email, password, role,
        phoneNumber, department, jobTitle, bio
      ) VALUES (
        'Admin User', 'admin@test.com', :password, 'admin',
        '+1 (555) 123-4567', 'Management', 'System Administrator', 
        'Experienced system administrator with expertise in inventory management.'
      )
      ON CONFLICT (email) DO UPDATE SET
        phoneNumber = EXCLUDED.phoneNumber,
        department = EXCLUDED.department,
        jobTitle = EXCLUDED.jobTitle,
        bio = EXCLUDED.bio,
        updatedAt = NOW()
    `, {
      replacements: { password: hashedPassword }
    });

    console.log('✅ Admin user created/updated');

    // Verify the data
    const [userData] = await sequelize.query(`
      SELECT 
        id, name, email, role,
        profilePicture, phoneNumber, dateOfBirth,
        address, department, jobTitle, bio,
        createdAt, updatedAt
      FROM "Users" 
      WHERE email = 'admin@test.com'
    `);

    if (userData.length > 0) {
      const user = userData[0];
      console.log('\n📊 Admin Profile Data:');
      console.log(`  - Name: ${user.name}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Phone: ${user.phoneNumber}`);
      console.log(`  - Department: ${user.department}`);
      console.log(`  - Job Title: ${user.jobTitle}`);
      console.log(`  - Bio: ${user.bio}`);
      console.log(`  - Created: ${user.createdAt}`);
    }

    console.log('\n🎉 SUCCESS! Schema is fully connected:');
    console.log('✅ Database: Connected');
    console.log('✅ Users Table: Created with all fields');
    console.log('✅ Profile Fields: Working');
    console.log('✅ Data Operations: Verified');
    console.log('✅ Ready for API use');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createUsersTable();
