const http = require('http');

// Create manager user
async function createManager() {
  try {
    console.log('👤 Creating Manager User...');
    
    const managerData = {
      name: 'Manager User',
      email: 'manager@test.com',
      password: 'manager123',
      role: 'manager'
    };

    const result = await registerUser(managerData);
    if (result.success) {
      console.log('✅ Manager user created successfully!');
      console.log('📋 Login: manager@test.com / manager123');
    } else {
      console.log('ℹ️ Manager user might already exist');
    }

    // Test manager product creation
    console.log('\n🧪 Testing Manager Product Creation...');
    const token = await login('manager@test.com', 'manager123');
    const productResult = await createProduct(token, {
      name: 'Manager Test Product',
      sku: 'MGR-TEST-001',
      description: 'Created by manager',
      uom: 'Units',
      costPrice: 25.00,
      salePrice: 35.00,
      minStockLevel: 10,
      reorderQty: 50
    });

    console.log(`Status: ${productResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (productResult.success) {
      console.log('🎉 Manager can create products!');
    } else {
      console.log(`Error: ${productResult.message}`);
    }

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

createManager();
