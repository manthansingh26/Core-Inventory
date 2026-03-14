-- CoreInventory Profile API Documentation
-- REST API Endpoints for Profile Management and Profile Picture Upload

-- =================================================================
-- 1. PROFILE ENDPOINTS
-- =================================================================

-- GET /api/auth/me
-- Description: Get current user profile information
-- Method: GET
-- Authentication: Bearer Token Required
-- Response:
-- {
--   "success": true,
--   "user": {
--     "id": "uuid",
--     "name": "string",
--     "email": "string", 
--     "role": "admin|manager|staff",
--     "avatar": "string",
--     "profilePicture": "string|null",
--     "isActive": true,
--     "createdAt": "timestamp",
--     "updatedAt": "timestamp"
--   }
-- }

-- PUT /api/auth/profile
-- Description: Update user profile information
-- Method: PUT
-- Authentication: Bearer Token Required
-- Request Body:
-- {
--   "name": "string",
--   "avatar": "string" (optional)
-- }
-- Response:
-- {
--   "success": true,
--   "message": "Profile updated!",
--   "user": { updated user object }
-- }

-- =================================================================
-- 2. PROFILE PICTURE ENDPOINTS
-- =================================================================

-- POST /api/upload/profile-picture
-- Description: Upload profile picture
-- Method: POST
-- Authentication: Bearer Token Required
-- Content-Type: multipart/form-data
-- Request Body: FormData with 'profilePicture' file
-- File Constraints:
-- - Type: image/* (jpg, jpeg, png, gif, webp)
-- - Size: Max 5MB
-- Response:
-- {
--   "success": true,
--   "message": "Profile picture uploaded successfully",
--   "profilePicture": "/uploads/profile-pictures/filename.jpg"
-- }

-- DELETE /api/upload/profile-picture
-- Description: Remove profile picture
-- Method: DELETE
-- Authentication: Bearer Token Required
-- Response:
-- {
--   "success": true,
--   "message": "Profile picture removed successfully"
-- }

-- =================================================================
-- 3. USER MANAGEMENT ENDPOINTS (Admin Only)
-- =================================================================

-- GET /api/users
-- Description: List all users (Admin only)
-- Method: GET
-- Authentication: Bearer Token + Admin Role Required
-- Response:
-- {
--   "success": true,
--   "data": [
--     {
--       "id": "uuid",
--       "name": "string",
--       "email": "string",
--       "role": "admin|manager|staff",
--       "profilePicture": "string|null",
--       "isActive": true,
--       "createdAt": "timestamp"
--     }
--   ]
-- }

-- PUT /api/users/:id
-- Description: Update user (Admin only)
-- Method: PUT
-- Authentication: Bearer Token + Admin Role Required
-- Request Body:
-- {
--   "name": "string",
--   "email": "string",
--   "role": "admin|manager|staff",
--   "isActive": true
-- }

-- =================================================================
-- 4. FRONTEND COMPONENTS SCHEMA
-- =================================================================

-- Profile.jsx Component Props:
-- interface ProfileProps {
--   user: {
--     id: string;
--     name: string;
--     email: string;
--     role: 'admin' | 'manager' | 'staff';
--     profilePicture?: string | null;
--   };
--   setUser: (user: any) => void;
-- }

-- Profile Component State:
-- interface ProfileState {
--   form: {
--     name: string;
--   };
--   loading: boolean;
--   uploading: boolean;
-- }

-- File Upload Handler:
-- interface FileUploadHandler {
--   (event: React.ChangeEvent<HTMLInputElement>): Promise<void>;
-- }

-- =================================================================
-- 5. DATABASE MODELS SCHEMA
-- =================================================================

-- User Model (Sequelize):
-- interface UserAttributes {
--   id: string; // UUID
--   name: string;
--   email: string;
--   password: string; // Hashed
--   role: 'admin' | 'manager' | 'staff';
--   avatar: string;
--   profilePicture: string | null;
--   resetOtp?: string;
--   resetOtpExpiry?: Date;
--   isActive: boolean;
--   createdAt: Date;
--   updatedAt: Date;
-- }

-- ProfilePictureUpload Model (Optional):
-- interface ProfilePictureUploadAttributes {
--   id: string; // UUID
--   UserId: string;
--   fileName: string;
--   filePath: string;
--   fileSize: number;
--   mimeType: string;
--   uploadedAt: Date;
--   isActive: boolean;
-- }

-- =================================================================
-- 6. ERROR RESPONSES
-- =================================================================

-- Authentication Errors:
-- {
--   "success": false,
--   "message": "Not authorized. No token."
-- }
-- {
--   "success": false,
--   "message": "Token invalid or expired."
-- }

-- Authorization Errors:
-- {
--   "success": false,
--   "message": "Access forbidden."
-- }

-- Validation Errors:
-- {
--   "success": false,
--   "message": "Name is required."
-- }

-- File Upload Errors:
-- {
--   "success": false,
--   "message": "No file uploaded."
-- }
-- {
--   "success": false,
--   "message": "Only image files are allowed."
-- }
-- {
--   "success": false,
--   "message": "File size must be less than 5MB."
-- }

-- =================================================================
-- 7. FRONTEND FORM VALIDATION SCHEMA
-- =================================================================

-- Profile Update Form:
-- interface ProfileForm {
--   name: {
--     value: string;
--     required: true;
--     minLength: 2;
--     maxLength: 255;
--     pattern: /^[a-zA-Z\s]+$/;
--   };
-- }

-- File Upload Validation:
-- interface FileValidation {
--   type: 'image/jpeg' | 'image/jpg' | 'image/png' | 'image/gif' | 'image/webp';
--   maxSize: 5 * 1024 * 1024; // 5MB
--   minSize: 1; // 1 byte
-- }

-- =================================================================
-- 8. SECURITY CONSIDERATIONS
-- =================================================================

-- File Upload Security:
-- - File type validation (whitelist image types only)
-- - File size limit (5MB max)
-- - Secure file naming (UUID + timestamp)
-- - Separate upload directory
-- - Virus scanning (recommended for production)

-- API Security:
-- - JWT token authentication
-- - Role-based access control
-- - Input validation and sanitization
-- - SQL injection prevention (Sequelize ORM)
-- - Rate limiting (recommended)

-- Data Privacy:
-- - Password hashing (bcrypt)
-- - No sensitive data in responses
-- - Audit logging for profile changes
-- - Data retention policies

-- =================================================================
-- 9. FRONTEND ROUTING SCHEMA
-- =================================================================

-- React Router Configuration:
-- interface RouteConfig {
--   path: '/profile';
--   component: Profile;
--   protected: true;
--   roles: ['admin', 'manager', 'staff'];
-- }

-- Navigation Items:
-- interface NavItem {
--   label: 'My Profile';
--   icon: 'User';
--   to: '/profile';
--   roles: ['admin', 'manager', 'staff'];
-- }

-- =================================================================
-- 10. TESTING SCHEMA
-- =================================================================

-- Unit Test Cases:
-- interface ProfileTestCases {
--   profileUpdate: {
--     validName: 'John Doe';
--     invalidName: '';
--     tooLongName: 'a'.repeat(256);
--   };
--   fileUpload: {
--     validImage: 'test.jpg';
--     invalidType: 'test.txt';
--     tooLarge: 'large.jpg'; // > 5MB
--   };
-- }

-- Integration Test Endpoints:
-- interface TestEndpoints {
--   login: 'POST /api/auth/login';
--   getProfile: 'GET /api/auth/me';
--   updateProfile: 'PUT /api/auth/profile';
--   uploadPicture: 'POST /api/upload/profile-picture';
--   removePicture: 'DELETE /api/upload/profile-picture';
-- }

-- =================================================================
-- USAGE EXAMPLES
-- =================================================================

-- Example 1: Update Profile Name
-- PUT /api/auth/profile
-- Headers: { "Authorization": "Bearer <token>" }
-- Body: { "name": "John Doe" }

-- Example 2: Upload Profile Picture
-- POST /api/upload/profile-picture
-- Headers: { "Authorization": "Bearer <token>" }
-- Body: FormData with file input named "profilePicture"

-- Example 3: Remove Profile Picture
-- DELETE /api/upload/profile-picture
-- Headers: { "Authorization": "Bearer <token>" }

-- Example 4: Get Current Profile
-- GET /api/auth/me
-- Headers: { "Authorization": "Bearer <token>" }
