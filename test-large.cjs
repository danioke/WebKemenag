const http = require('http');

const largeString = 'a'.repeat(5 * 1024 * 1024); // 5MB
const data = JSON.stringify({
  title: 'Test Large',
  category: 'Pendidikan',
  date: '2024-01-01',
  author: '',
  image: '',
  excerpt: largeString,
  createdAt: { seconds: 1000, nanoseconds: 0 }
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/db/news',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
