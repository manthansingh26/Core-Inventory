const http = require('http');

// First, login to get token
function login() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: 'admin@test.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            resolve(response.token);
          } else {
            reject(new Error(response.message));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// Create warehouse with token
function createWarehouse(token, warehouseData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(warehouseData);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/warehouses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Main function
async function setupWarehouses() {
  try {
    console.log('🔐 Logging in...');
    const token = await login();
    console.log('✅ Login successful!');

    const warehouses = [
      {
        name: 'Main Warehouse',
        code: 'WH001',
        address: '123 Main St, City, State'
      },
      {
        name: 'Secondary Warehouse',
        code: 'WH002',
        address: '456 Oak Ave, City, State'
      },
      {
        name: 'Distribution Center',
        code: 'WH003',
        address: '789 Industrial Blvd, City, State'
      }
    ];

    console.log('🏭 Creating warehouses...');
    for (const warehouse of warehouses) {
      const result = await createWarehouse(token, warehouse);
      if (result.success) {
        console.log(`✅ Created: ${warehouse.name} (${warehouse.code})`);
      } else {
        console.log(`❌ Failed to create ${warehouse.name}: ${result.message}`);
      }
    }

    console.log('🎉 Warehouse setup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Server is running on port 5000');
    console.log('2. Admin user exists (admin@test.com / admin123)');
    console.log('3. Database is connected');
  }
}

setupWarehouses();
