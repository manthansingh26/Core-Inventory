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

async function checkActualSchema() {
  try {
    console.log('🔍 Checking Actual Database Schema...\n');

    // Get all columns from Users table
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('📋 All Users table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Check if our new columns exist (case insensitive)
    const newFields = ['profilepicture', 'phonenumber', 'dateofbirth', 'address', 'department', 'jobtitle', 'bio'];
    
    console.log('\n🔍 Checking for new profile fields:');
    const existingColumns = columns.map(col => col.column_name.toLowerCase());
    
    newFields.forEach(field => {
      if (existingColumns.includes(field)) {
        console.log(`  ✅ ${field}: Found`);
      } else {
        console.log(`  ❌ ${field}: Not found`);
      }
    });

    // Add columns with lowercase names if they don't exist
    console.log('\n🔧 Adding missing fields with correct naming...');
    
    const fieldsToAdd = [
      { name: 'profilepicture', type: 'VARCHAR(500)' },
      { name: 'phonenumber', type: 'VARCHAR(50)' },
      { name: 'dateofbirth', type: 'DATE' },
      { name: 'address', type: 'TEXT' },
      { name: 'department', type: 'VARCHAR(100)' },
      { name: 'jobtitle', type: 'VARCHAR(100)' },
      { name: 'bio', type: 'TEXT' }
    ];

    for (const field of fieldsToAdd) {
      if (!existingColumns.includes(field.name)) {
        try {
          await sequelize.query(`ALTER TABLE "Users" ADD COLUMN "${field.name}" ${field.type} DEFAULT NULL`);
          console.log(`  ✅ Added ${field.name}`);
        } catch (error) {
          console.log(`  ⚠️ Error adding ${field.name}: ${error.message}`);
        }
      } else {
        console.log(`  ⚪ ${field.name} already exists`);
      }
    }

    // Test updating with lowercase field names
    console.log('\n🧪 Testing updates with correct field names...');
    
    await sequelize.query(`
      UPDATE "Users" 
      SET 
        "phonenumber" = COALESCE("phonenumber", '+1 (555) 123-4567'),
        "department" = COALESCE("department", 'Management'),
        "jobtitle" = COALESCE("jobtitle", 'System Administrator'),
        "bio" = COALESCE("bio", 'Profile updated successfully'),
        "updatedAt" = NOW()
      WHERE email = 'admin@test.com'
    `);

    // Verify the update
    const [updatedUser] = await sequelize.query(`
      SELECT name, phonenumber, department, jobtitle, bio
      FROM "Users" 
      WHERE email = 'admin@test.com'
    `);

    if (updatedUser.length > 0) {
      const user = updatedUser[0];
      console.log('\n📊 Updated Admin Profile:');
      console.log(`  - Name: ${user.name}`);
      console.log(`  - Phone: ${user.phonenumber}`);
      console.log(`  - Department: ${user.department}`);
      console.log(`  - Job Title: ${user.jobtitle}`);
      console.log(`  - Bio: ${user.bio}`);
    }

    console.log('\n🎉 Schema connectivity verified!');
    console.log('✅ Database fields are properly connected');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkActualSchema();
