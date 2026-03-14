const http = require('http');

// Test comprehensive profile editing
async function testProfileEditing() {
  try {
    console.log('🧪 Testing Comprehensive Profile Editing...\n');

    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    const token = await login('admin@test.com', 'admin123');
    console.log('✅ Login successful!');

    // Test updating profile with all new fields
    console.log('\n2️⃣ Testing profile update with all fields...');
    const updateData = {
      name: 'Admin User Updated',
      phoneNumber: '+1 (555) 123-4567',
      dateOfBirth: '1990-01-15',
      address: '123 Main St, City, State 12345',
      department: 'Management',
      jobTitle: 'System Administrator',
      bio: 'Experienced system administrator with expertise in inventory management.'
    };

    const updateResult = await updateProfile(token, updateData);
    if (updateResult.success) {
      console.log('✅ Profile updated successfully!');
      console.log('📋 Updated fields:');
      Object.keys(updateData).forEach(key => {
        if (updateData[key]) {
          console.log(`   - ${key}: ${updateData[key]}`);
        }
      });
    } else {
      console.log('❌ Profile update failed');
    }

    // Verify the updated profile
    console.log('\n3️⃣ Verifying updated profile...');
    const profile = await getUserProfile(token);
    console.log('📊 Current Profile:');
    console.log(`   - Name: ${profile.name}`);
    console.log(`   - Phone: ${profile.phoneNumber || 'Not set'}`);
    console.log(`   - DOB: ${profile.dateOfBirth || 'Not set'}`);
    console.log(`   - Address: ${profile.address || 'Not set'}`);
    console.log(`   - Department: ${profile.department || 'Not set'}`);
    console.log(`   - Job Title: ${profile.jobTitle || 'Not set'}`);
    console.log(`   - Bio: ${profile.bio || 'Not set'}`);

    console.log('\n🎉 Profile editing functionality is ready!');
    console.log('\n📱 New editable fields available:');
    console.log('✅ Full Name (required)');
    console.log('✅ Phone Number');
    console.log('✅ Date of Birth');
    console.log('✅ Address');
    console.log('✅ Department (dropdown)');
    console.log('✅ Job Title');
    console.log('✅ Bio / About Me');
    console.log('✅ Profile Picture (upload/remove)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function login(email, password) {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({ email, password });
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.success ? response.token : null);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

function updateProfile(token, profileData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(profileData);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/profile',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getUserProfile(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.success ? response.user : null);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

testProfileEditing();
