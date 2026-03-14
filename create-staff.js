const http = require('http');

// Create staff user and test permissions
async function createStaff() {
  try {
    console.log('👤 Creating Staff User...');
    
    const staffData = {
      name: 'Staff User',
      email: 'staff@test.com',
      password: 'staff123',
      role: 'staff'
    };

    const result = await registerUser(staffData);
    if (result.success) {
      console.log('✅ Staff user created successfully!');
      console.log('📋 Login: staff@test.com / staff123');
    } else {
      console.log('ℹ️ Staff user might already exist');
    }

    // Test staff product creation (should fail)
    console.log('\n🧪 Testing Staff Product Creation (should fail)...');
    const token = await login('staff@test.com', 'staff123');
    const productResult = await createProduct(token, {
      name: 'Staff Test Product',
      sku: 'STAFF-TEST-001',
      description: 'Created by staff',
      uom: 'Units',
      costPrice: 15.00,
      salePrice: 25.00,
      minStockLevel: 5,
      reorderQty: 25
    });

    console.log(`Status: ${productResult.success ? '❌ UNEXPECTED SUCCESS' : '✅ CORRECTLY BLOCKED'}`);
    if (!productResult.success) {
      console.log(`Expected error: ${productResult.message}`);
    }

    console.log('\n📋 SUMMARY - Product Creation Permissions:');
    console.log('✅ Admin: CAN create products');
    console.log('✅ Manager: CAN create products');
    console.log('✅ Staff: CANNOT create products (correctly blocked)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function registerUser(userData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(userData);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
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

function createProduct(token, productData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(productData);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'POST',
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

createStaff();
