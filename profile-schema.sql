-- CoreInventory Profile Management Schema
-- This file contains all database schema updates for profile editing and profile picture functionality

-- =================================================================
-- 1. UPDATE USERS TABLE - Add Profile Picture Field
-- =================================================================

-- Add profilePicture column to Users table
ALTER TABLE "Users" 
ADD COLUMN "profilePicture" VARCHAR(500) DEFAULT NULL;

-- Add additional profile fields
ALTER TABLE "Users" 
ADD COLUMN "phoneNumber" VARCHAR(50) DEFAULT NULL;

ALTER TABLE "Users" 
ADD COLUMN "dateOfBirth" DATE DEFAULT NULL;

ALTER TABLE "Users" 
ADD COLUMN "address" TEXT DEFAULT NULL;

ALTER TABLE "Users" 
ADD COLUMN "department" VARCHAR(100) DEFAULT NULL;

ALTER TABLE "Users" 
ADD COLUMN "jobTitle" VARCHAR(100) DEFAULT NULL;

ALTER TABLE "Users" 
ADD COLUMN "bio" TEXT DEFAULT NULL;

-- Add comment to describe the new column
COMMENT ON COLUMN "Users"."profilePicture" IS 'Path to profile picture file relative to uploads directory';

-- =================================================================
-- 2. PROFILE PICTURE STORAGE TABLE (Optional - for tracking uploads)
-- =================================================================

CREATE TABLE IF NOT EXISTS "ProfilePictureUploads" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "fileName" VARCHAR(255) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "isActive" BOOLEAN DEFAULT true
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_profile_pictures_user_id" ON "ProfilePictureUploads"("UserId");
CREATE INDEX IF NOT EXISTS "idx_profile_pictures_active" ON "ProfilePictureUploads"("isActive");

-- =================================================================
-- 3. PROFILE UPDATE AUDIT LOG (Optional - for tracking changes)
-- =================================================================

CREATE TABLE IF NOT EXISTS "ProfileUpdateLogs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "fieldChanged" VARCHAR(50) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "ipAddress" INET,
    "userAgent" TEXT
);

-- Add indexes for audit log
CREATE INDEX IF NOT EXISTS "idx_profile_logs_user_id" ON "ProfileUpdateLogs"("UserId");
CREATE INDEX IF NOT EXISTS "idx_profile_logs_changed_at" ON "ProfileUpdateLogs"("changedAt");

-- =================================================================
-- 4. TRIGGERS FOR AUTOMATIC LOGGING (Optional)
-- =================================================================

-- Function to log profile changes
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log name changes
    IF OLD.name IS DISTINCT FROM NEW.name THEN
        INSERT INTO "ProfileUpdateLogs" ("UserId", "fieldChanged", "oldValue", "newValue")
        VALUES (NEW.id, 'name', OLD.name, NEW.name);
    END IF;
    
    -- Log email changes
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        INSERT INTO "ProfileUpdateLogs" ("UserId", "fieldChanged", "oldValue", "newValue")
        VALUES (NEW.id, 'email', OLD.email, NEW.email);
    END IF;
    
    -- Log profile picture changes
    IF OLD."profilePicture" IS DISTINCT FROM NEW."profilePicture" THEN
        INSERT INTO "ProfileUpdateLogs" ("UserId", "fieldChanged", "oldValue", "newValue")
        VALUES (NEW.id, 'profilePicture', OLD."profilePicture", NEW."profilePicture");
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic logging
DROP TRIGGER IF EXISTS trigger_profile_update_log ON "Users";
CREATE TRIGGER trigger_profile_update_log
    BEFORE UPDATE ON "Users"
    FOR EACH ROW
    EXECUTE FUNCTION log_profile_changes();

-- =================================================================
-- 5. VIEWS FOR EASY PROFILE DATA ACCESS
-- =================================================================

-- View for complete user profile information
CREATE OR REPLACE VIEW "UserProfiles" AS
SELECT 
    u."id",
    u."name",
    u."email",
    u."role",
    u."avatar",
    u."profilePicture",
    u."isActive",
    u."createdAt",
    u."updatedAt",
    CASE 
        WHEN u."profilePicture" IS NOT NULL THEN 
            CONCAT('/uploads/profile-pictures/', u."profilePicture")
        ELSE NULL 
    END AS "profilePictureUrl",
    -- Count of profile picture uploads
    (SELECT COUNT(*) FROM "ProfilePictureUploads" ppu WHERE ppu."UserId" = u."id" AND ppu."isActive" = true) AS "profilePictureCount"
FROM "Users" u;

-- View for profile update statistics
CREATE OR REPLACE VIEW "ProfileUpdateStats" AS
SELECT 
    u."id",
    u."name",
    u."email",
    COUNT(pul."id") AS "totalUpdates",
    MAX(pul."changedAt") AS "lastUpdate",
    COUNT(CASE WHEN pul."fieldChanged" = 'profilePicture' THEN 1 END) AS "pictureUpdates"
FROM "Users" u
LEFT JOIN "ProfileUpdateLogs" pul ON u."id" = pul."UserId"
GROUP BY u."id", u."name", u."email";

-- =================================================================
-- 6. STORED PROCEDURES FOR PROFILE MANAGEMENT
-- =================================================================

-- Procedure to update profile picture safely
CREATE OR REPLACE FUNCTION update_profile_picture(
    user_id UUID,
    file_path VARCHAR,
    file_name VARCHAR,
    file_size INTEGER,
    mime_type VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Deactivate old profile pictures
    UPDATE "ProfilePictureUploads" 
    SET "isActive" = false 
    WHERE "UserId" = user_id;
    
    -- Insert new profile picture record
    INSERT INTO "ProfilePictureUploads"("UserId", "fileName", "filePath", "fileSize", "mimeType")
    VALUES (user_id, file_name, file_path, file_size, mime_type);
    
    -- Update user's profile picture path
    UPDATE "Users" 
    SET "profilePicture" = file_path,
        "updatedAt" = now()
    WHERE "id" = user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating profile picture: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Procedure to remove profile picture
CREATE OR REPLACE FUNCTION remove_profile_picture(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Deactivate all profile picture uploads
    UPDATE "ProfilePictureUploads" 
    SET "isActive" = false 
    WHERE "UserId" = user_id;
    
    -- Clear user's profile picture
    UPDATE "Users" 
    SET "profilePicture" = NULL,
        "updatedAt" = now()
    WHERE "id" = user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error removing profile picture: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- 7. SECURITY POLICIES (Row Level Security)
-- =================================================================

-- Enable RLS on profile tables
ALTER TABLE "ProfilePictureUploads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProfileUpdateLogs" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile picture uploads
CREATE POLICY "users_own_profile_pictures" ON "ProfilePictureUploads"
    FOR ALL USING ("UserId" = current_setting('app.current_user_id', true)::UUID);

-- Policy: Users can only see their own profile update logs
CREATE POLICY "users_own_profile_logs" ON "ProfileUpdateLogs"
    FOR ALL USING ("UserId" = current_setting('app.current_user_id', true)::UUID);

-- =================================================================
-- 8. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =================================================================

-- Additional indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_users_profile_picture" ON "Users"("profilePicture") WHERE "profilePicture" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_profile_pictures_uploaded_at" ON "ProfilePictureUploads"("uploadedAt");
CREATE INDEX IF NOT EXISTS "idx_profile_logs_field_changed" ON "ProfileUpdateLogs"("fieldChanged");

-- =================================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- =================================================================

-- Insert sample profile picture upload (for testing)
-- This would be done programmatically, but here's the structure:
-- INSERT INTO "ProfilePictureUploads" ("UserId", "fileName", "filePath", "fileSize", "mimeType")
-- VALUES (
--     (SELECT "id" FROM "Users" WHERE "email" = 'admin@test.com'),
--     'admin-avatar.jpg',
--     '/uploads/profile-pictures/admin-avatar.jpg',
--     123456,
--     'image/jpeg'
-- );

-- =================================================================
-- 10. VALIDATION CONSTRAINTS
-- =================================================================

-- Add check constraint for profile picture path format
ALTER TABLE "Users" 
ADD CONSTRAINT "valid_profile_picture_path" 
CHECK (
    "profilePicture" IS NULL OR 
    ("profilePicture" ~ '^/uploads/profile-pictures/[^/]+\.(jpg|jpeg|png|gif|webp)$')
);

-- Add check constraint for file size
ALTER TABLE "ProfilePictureUploads" 
ADD CONSTRAINT "valid_file_size" 
CHECK ("fileSize" > 0 AND "fileSize" <= 5242880); -- 5MB max

-- Add check constraint for mime type
ALTER TABLE "ProfilePictureUploads" 
ADD CONSTRAINT "valid_mime_type" 
CHECK ("mimeType" IN ('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'));

-- =================================================================
-- SUMMARY OF CHANGES
-- =================================================================

-- Tables Modified:
-- ✅ Users table - Added profilePicture column
-- ✅ ProfilePictureUploads table - NEW (tracks uploads)
-- ✅ ProfileUpdateLogs table - NEW (audit trail)

-- Views Created:
-- ✅ UserProfiles - Complete profile information
-- ✅ ProfileUpdateStats - Profile update statistics

-- Stored Procedures:
-- ✅ update_profile_picture() - Safe profile picture updates
-- ✅ remove_profile_picture() - Safe profile picture removal

-- Security:
-- ✅ Row Level Security policies
-- ✅ Validation constraints
-- ✅ Performance indexes

-- Usage:
-- 1. Use the stored procedures for profile picture operations
-- 2. Query the UserProfiles view for complete profile data
-- 3. Monitor ProfileUpdateLogs for audit trail
-- 4. Use ProfileUpdateStats for analytics
