// Create warehouses using API calls
const http = require('http');

const postData = JSON.stringify({
  name: 'Main Warehouse',
  code: 'WH001',
  address: '123 Main St, City, State'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/warehouses',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log('Response:', d.toString());
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(postData);
req.end();
