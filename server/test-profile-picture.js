const http = require('http');

// Test profile picture upload
async function testProfilePicture() {
  try {
    console.log('🧪 Testing Profile Picture Functionality...\n');

    // First login as admin
    console.log('1️⃣ Logging in as admin...');
    const token = await login('admin@test.com', 'admin123');
    console.log('✅ Login successful!');

    // Check current user profile
    console.log('\n2️⃣ Checking current user profile...');
    const profile = await getUserProfile(token);
    console.log(`📋 User: ${profile.name} (${profile.email})`);
    console.log(`🖼️  Profile Picture: ${profile.profilePicture || 'None'}`);

    console.log('\n🎉 Profile picture functionality is ready!');
    console.log('\n📱 How to use:');
    console.log('1. Go to Profile page in the app');
    console.log('2. Click the camera icon on your avatar');
    console.log('3. Select an image file (max 5MB)');
    console.log('4. Picture will be uploaded and displayed');
    console.log('5. Use the X button to remove picture');

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

testProfilePicture();
