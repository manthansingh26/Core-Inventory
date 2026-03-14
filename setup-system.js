const http = require('http');

// Register admin user
function registerUser(userData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(userData);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

// Login to get token
function login(email, password) {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({ email, password });

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

// Main setup function
async function setupSystem() {
  try {
    console.log('👤 Creating admin user...');
    const adminUser = {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    };
    
    const registerResult = await registerUser(adminUser);
    if (registerResult.success) {
      console.log('✅ Admin user created successfully!');
    } else {
      console.log('ℹ️ Admin user might already exist, continuing...');
    }

    console.log('🔐 Logging in...');
    const token = await login('admin@test.com', 'admin123');
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
        console.log(`ℹ️ ${warehouse.name} might already exist`);
      }
    }

    console.log('\n🎉 Setup complete!');
    console.log('📋 Login credentials:');
    console.log('   Admin: admin@test.com / admin123');
    console.log('\n🏭 Warehouses created:');
    console.log('   - Main Warehouse (WH001)');
    console.log('   - Secondary Warehouse (WH002)');
    console.log('   - Distribution Center (WH003)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the server is running on port 5000');
  }
}

setupSystem();
