const http = require('http');

// 簡単なヘルスチェックサーバー
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(8990, '0.0.0.0', () => {
  console.log('Health check server running on port 8990');
});