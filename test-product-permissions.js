const http = require('http');

// Test product creation with different roles
async function testProductPermissions() {
  try {
    console.log('🧪 Testing Product Creation Permissions...\n');

    // Test 1: Admin login and create product
    console.log('1️⃣ Testing ADMIN role:');
    const adminToken = await login('admin@test.com', 'admin123');
    const adminResult = await createProduct(adminToken, {
      name: 'Test Product Admin',
      sku: 'TP-ADMIN-001',
      description: 'Created by admin',
      uom: 'Units',
      costPrice: 10.50,
      salePrice: 15.99,
      minStockLevel: 5,
      reorderQty: 20
    });
    console.log(`   Status: ${adminResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!adminResult.success) console.log(`   Error: ${adminResult.message}`);

    // Test 2: Manager login and create product
    console.log('\n2️⃣ Testing MANAGER role:');
    const managerToken = await login('manager@test.com', 'manager123');
    const managerResult = await createProduct(managerToken, {
      name: 'Test Product Manager',
      sku: 'TP-MANAGER-001',
      description: 'Created by manager',
      uom: 'Units',
      costPrice: 12.75,
      salePrice: 18.99,
      minStockLevel: 3,
      reorderQty: 15
    });
    console.log(`   Status: ${managerResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!managerResult.success) console.log(`   Error: ${managerResult.message}`);

    // Test 3: Staff login and try to create product (should fail)
    console.log('\n3️⃣ Testing STAFF role (should fail):');
    const staffToken = await login('staff@test.com', 'staff123');
    const staffResult = await createProduct(staffToken, {
      name: 'Test Product Staff',
      sku: 'TP-STAFF-001',
      description: 'Created by staff',
      uom: 'Units',
      costPrice: 8.25,
      salePrice: 12.99,
      minStockLevel: 2,
      reorderQty: 10
    });
    console.log(`   Status: ${staffResult.success ? '❌ UNEXPECTED SUCCESS' : '✅ CORRECTLY BLOCKED'}`);
    if (!staffResult.success) console.log(`   Error: ${staffResult.message}`);

    console.log('\n🎉 Permission test complete!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
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

testProductPermissions();
