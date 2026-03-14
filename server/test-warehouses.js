const http = require('http');

// Test warehouse listing
function testWarehouses() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/warehouses',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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
    req.end();
  });
}

testWarehouses().then(result => {
  console.log('📦 Warehouse API Test:');
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('❌ Error:', err.message);
});
