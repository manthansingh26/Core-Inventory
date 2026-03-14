# OTP Email Verification System

## Overview
The CoreInventory system now includes OTP (One-Time Password) verification for:
1. **User Registration** - Email verification required before account activation
2. **Password Reset** - Secure password recovery via email OTP

## Features

### Registration Flow
1. User fills registration form (name, email, password, role)
2. System generates 6-digit OTP and sends to email
3. User enters OTP to verify email
4. Account is activated and user is logged in

### Password Reset Flow
1. User enters email address
2. System sends 6-digit OTP to email
3. User verifies OTP
4. User sets new password
5. Password is updated

## Setup Instructions

### 1. Run Database Migration
```bash
cd server
node add-email-verification.js
```

This adds the following columns to the Users table:
- `verificationOtp` - Stores registration OTP
- `verificationOtpExpiry` - OTP expiration timestamp
- `isVerified` - Email verification status

### 2. Configure Email Settings
Add these to your `server/.env` file:

```env
# Email Configuration (for production)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# For Gmail, use App Password:
# 1. Enable 2FA on your Google account
# 2. Go to https://myaccount.google.com/apppasswords
# 3. Generate an app password for "Mail"
# 4. Use that password in EMAIL_PASS
```

### 3. Development Mode
In development (`NODE_ENV=development`), the OTP is returned in the API response for easy testing:

```json
{
  "success": true,
  "message": "OTP sent (dev mode)",
  "otp": "123456",
  "userId": "user-id-here"
}
```

## API Endpoints

### Registration
**POST** `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "staff"
}
```

Response:
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "userId": "uuid",
  "requiresVerification": true,
  "otp": "123456" // only in dev mode
}
```

### Verify Registration OTP
**POST** `/api/auth/verify-registration`
```json
{
  "userId": "uuid",
  "otp": "123456"
}
```

Response:
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "token": "jwt-token",
  "user": { ... }
}
```

### Resend Verification OTP
**POST** `/api/auth/resend-verification`
```json
{
  "userId": "uuid"
}
```

### Forgot Password
**POST** `/api/auth/forgot-password`
```json
{
  "email": "john@example.com"
}
```

### Verify Reset OTP
**POST** `/api/auth/verify-otp`
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Reset Password
**POST** `/api/auth/reset-password`
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

## Security Features

1. **OTP Expiration**: All OTPs expire after 10 minutes
2. **One-Time Use**: OTPs are cleared after successful verification
3. **Email Verification Required**: Unverified users cannot log in
4. **Secure Password Hashing**: Passwords are hashed with bcrypt (12 rounds)
5. **JWT Authentication**: Secure token-based authentication

## Email Templates

### Registration Email
```
Subject: Verify Your Email - CoreInventory

Welcome to CoreInventory!

Hi [Name],

Your verification OTP is: 123456

This code will expire in 10 minutes.

If you didn't create this account, please ignore this email.
```

### Password Reset Email
```
Subject: Your Password Reset OTP

Password Reset OTP

Your OTP is: 123456

Valid for 10 minutes.
```

## Testing

### Development Testing
1. Register a new user
2. Check console/API response for OTP
3. Enter OTP in verification screen
4. Account is activated

### Production Testing
1. Configure email settings in `.env`
2. Register with a real email address
3. Check email inbox for OTP
4. Complete verification

## Troubleshooting

### OTP Not Received
- Check spam/junk folder
- Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in `.env`
- For Gmail, ensure you're using an App Password, not your regular password
- Check server logs for email sending errors

### "Email already registered" Error
- Email is already in use
- Check if user exists in database
- User may need to complete verification or reset password

### "Invalid or expired OTP" Error
- OTP has expired (10 minutes)
- Wrong OTP entered
- Request a new OTP using "Resend OTP" button

### Login Shows "Please verify your email first"
- User registered but didn't complete email verification
- Resend verification OTP from login page (feature can be added)
- Or manually update `isVerified` to `true` in database for testing

## Backward Compatibility

Existing users are automatically marked as verified when running the migration script. This ensures:
- No disruption to existing accounts
- Smooth transition to OTP system
- Only new registrations require verification

## Future Enhancements

Potential improvements:
- SMS OTP as alternative to email
- Configurable OTP length and expiration
- Rate limiting for OTP requests
- Account lockout after multiple failed attempts
- Email verification reminder notifications
- Resend OTP from login page for unverified users
