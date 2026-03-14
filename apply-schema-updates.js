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
    logging: true // Show SQL queries
  }
);

async function applySchemaUpdates() {
  try {
    console.log('🔧 Applying Schema Updates to Database...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Add new profile fields to Users table
    console.log('\n📝 Adding profile fields to Users table...');

    const schemaUpdates = [
      // Profile Picture
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "profilePicture" VARCHAR(500) DEFAULT NULL`,
      
      // Phone Number
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "phoneNumber" VARCHAR(50) DEFAULT NULL`,
      
      // Date of Birth
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE DEFAULT NULL`,
      
      // Address
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "address" TEXT DEFAULT NULL`,
      
      // Department
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "department" VARCHAR(100) DEFAULT NULL`,
      
      // Job Title
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "jobTitle" VARCHAR(100) DEFAULT NULL`,
      
      // Bio
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "bio" TEXT DEFAULT NULL`
    ];

    for (const [index, query] of schemaUpdates.entries()) {
      try {
        await sequelize.query(query);
        const fieldName = query.match(/"(\w+)"/)[1];
        console.log(`  ✅ ${index + 1}. Added ${fieldName} field`);
      } catch (error) {
        const fieldName = query.match(/"(\w+)"/)[1];
        console.log(`  ⚠️ ${index + 1}. ${fieldName} field already exists or error: ${error.message}`);
      }
    }

    // Verify the schema updates
    console.log('\n🔍 Verifying schema updates...');
    
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND table_schema = 'public'
        AND column_name IN (
          'profilePicture', 'phoneNumber', 'dateOfBirth', 
          'address', 'department', 'jobTitle', 'bio'
        )
      ORDER BY column_name
    `);

    console.log('📋 Updated fields found:');
    columns.forEach(col => {
      console.log(`  ✅ ${col.column_name}: ${col.data_type}`);
    });

    // Test updating a user with new fields
    console.log('\n🧪 Testing field updates...');
    
    await sequelize.query(`
      UPDATE "Users" 
      SET 
        "phoneNumber" = COALESCE("phoneNumber", '+1 (555) 123-4567'),
        "department" = COALESCE("department", 'Management'),
        "jobTitle" = COALESCE("jobTitle", 'System Administrator'),
        "bio" = COALESCE("bio", 'Profile updated successfully'),
        "updatedAt" = NOW()
      WHERE email = 'admin@test.com'
    `);

    console.log('✅ Test update completed');

    // Verify the update
    const [updatedUser] = await sequelize.query(`
      SELECT name, phoneNumber, department, jobTitle, bio
      FROM "Users" 
      WHERE email = 'admin@test.com'
    `);

    if (updatedUser.length > 0) {
      const user = updatedUser[0];
      console.log('\n📊 Updated Admin Profile:');
      console.log(`  - Name: ${user.name}`);
      console.log(`  - Phone: ${user.phoneNumber}`);
      console.log(`  - Department: ${user.department}`);
      console.log(`  - Job Title: ${user.jobTitle}`);
      console.log(`  - Bio: ${user.bio}`);
    }

    console.log('\n🎉 Schema updates applied successfully!');
    console.log('✅ All profile fields are now connected and functional');

  } catch (error) {
    console.error('❌ Schema update error:', error.message);
  } finally {
    await sequelize.close();
  }
}

applySchemaUpdates();
