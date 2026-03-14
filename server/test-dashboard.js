const http = require('http');

// Test dashboard API
async function testDashboard() {
  try {
    console.log('🧪 Testing Dashboard API...\n');

    // Login first
    console.log('1️⃣ Logging in...');
    const loginResult = await new Promise((resolve, reject) => {
      const loginData = JSON.stringify({ email: 'admin@test.com', password: 'admin123' });
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
            resolve(response);
          } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    if (!loginResult.success) {
      console.log('❌ Login failed:', loginResult.message);
      return;
    }

    console.log('✅ Login successful');
    const token = loginResult.token;

    // Test dashboard API
    console.log('\n2️⃣ Testing dashboard API...');
    const dashboardResult = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/dashboard',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({ status: res.statusCode, data: response });
          } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.end();
    });

    console.log(`📊 Status Code: ${dashboardResult.status}`);
    
    if (dashboardResult.data.success) {
      console.log('✅ Dashboard API working!');
      
      const { kpis, recentMoves } = dashboardResult.data.data;
      
      console.log('\n📈 KPIs:');
      console.log(`  - Total Products: ${kpis.totalProducts}`);
      console.log(`  - Low Stock Items: ${kpis.lowStockCount}`);
      console.log(`  - Out of Stock Items: ${kpis.outOfStockCount}`);
      console.log(`  - Pending Receipts: ${kpis.pendingReceipts}`);
      console.log(`  - Pending Deliveries: ${kpis.pendingDeliveries}`);
      console.log(`  - Pending Transfers: ${kpis.pendingTransfers}`);
      console.log(`  - Late Receipts: ${kpis.lateReceipts}`);
      console.log(`  - Late Deliveries: ${kpis.lateDeliveries}`);
      console.log(`  - Done Today: ${kpis.doneToday}`);
      
      console.log('\n📊 Recent Moves:');
      console.log(`  - Total entries: ${recentMoves.length}`);
      recentMoves.forEach((move, index) => {
        console.log(`  ${index + 1}. ${move.id.date} - ${move.id.type}: ${move.count}`);
      });
      
      console.log('\n🎉 Dashboard API is working correctly!');
      
    } else {
      console.log('❌ Dashboard API failed:', dashboardResult.data.message);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testDashboard();
