const http = require('http');
const { spawn } = require('child_process');

// GraphHopperプロセスを保持
let graphhopperProcess = null;
let isGraphHopperRunning = false;
let startupLogs = [];

// GraphHopperを起動
function startGraphHopper() {
  console.log('Starting GraphHopper...');
  
  const javaOpts = process.env.JAVA_OPTS || '-Xmx1g -Xms256m';
  graphhopperProcess = spawn('java', [...javaOpts.split(' '), '-jar', 'graphhopper.jar', 'server', 'config.yml'], {
    cwd: '/graphhopper',
    env: process.env
  });

  graphhopperProcess.stdout.on('data', (data) => {
    const log = data.toString();
    console.log('GraphHopper:', log);
    startupLogs.push(log);
    if (log.includes('Started @') || log.includes('Server started')) {
      isGraphHopperRunning = true;
    }
  });

  graphhopperProcess.stderr.on('data', (data) => {
    const log = data.toString();
    console.error('GraphHopper Error:', log);
    startupLogs.push('ERROR: ' + log);
  });

  graphhopperProcess.on('exit', (code) => {
    console.log(`GraphHopper exited with code ${code}`);
    isGraphHopperRunning = false;
  });
}

// HTTPサーバー
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      graphhopper: isGraphHopperRunning ? 'running' : 'stopped',
      logs: startupLogs.slice(-20) // 最新20行のログ
    }));
  } else if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('GraphHopper Wrapper Service\n');
  } else {
    // GraphHopperへのプロキシ
    if (isGraphHopperRunning) {
      const proxy = http.request({
        hostname: 'localhost',
        port: 8989,
        path: req.url,
        method: req.method,
        headers: req.headers
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      
      proxy.on('error', (err) => {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('GraphHopper is not responding');
      });
      
      req.pipe(proxy);
    } else {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('GraphHopper is not running yet');
    }
  }
});

// GraphHopperを起動
startGraphHopper();

// HTTPサーバーを起動（ポート8990）
server.listen(8990, '0.0.0.0', () => {
  console.log('Wrapper server running on port 8990');
});