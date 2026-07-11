const http = require('http');

const data = JSON.stringify({
  title: 'Test',
  category: 'Pendidikan',
  date: '2024-01-01',
  author: '',
  image: '',
  excerpt: '<p>test</p>',
  createdAt: { seconds: 1000, nanoseconds: 0 }
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/db/news',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
