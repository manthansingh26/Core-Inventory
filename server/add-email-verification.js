const sequelize = require('./src/config/database');

async function addEmailVerificationColumns() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Add new columns if they don't exist
    await sequelize.query(`
      ALTER TABLE "Users" 
      ADD COLUMN IF NOT EXISTS "verificationOtp" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "verificationOtpExpiry" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false;
    `);

    console.log('✓ Email verification columns added');

    // Update existing users to be verified (backward compatibility)
    await sequelize.query(`
      UPDATE "Users" 
      SET "isVerified" = true 
      WHERE "isVerified" IS NULL OR "isVerified" = false;
    `);

    console.log('✓ Existing users marked as verified');
    console.log('✓ Migration complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

addEmailVerificationColumns();
