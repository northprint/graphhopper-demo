const http = require('http');
const { spawn } = require('child_process');

// GraphHopperプロセスを保持
let graphhopperProcess = null;
let isGraphHopperRunning = false;
let startupLogs = [];

// App Runnerは環境変数PORTを設定する
const PORT = process.env.PORT || 8990;
const GRAPHHOPPER_PORT = 8991;

// GraphHopperを起動
function startGraphHopper() {
  console.log('Starting GraphHopper...');
  
  const javaOpts = process.env.JAVA_OPTS || '-Xmx1g -Xms256m';
  graphhopperProcess = spawn('java', [...javaOpts.split(' '), '-jar', 'graphhopper.jar', 'server', 'config-apprunner.yml'], {
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
    startupLogs.push(`GraphHopper exited with code ${code}`);
  });

  graphhopperProcess.on('error', (err) => {
    console.error('Failed to start GraphHopper:', err);
    startupLogs.push('ERROR: Failed to start GraphHopper: ' + err.message);
  });
}

// CORSヘッダーを設定する関数
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// HTTPサーバー
const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // CORSヘッダーを追加
  setCorsHeaders(res);

  // プリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

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
      // リクエストヘッダーをコピー（Host以外）
      const proxyHeaders = Object.assign({}, req.headers);
      delete proxyHeaders.host;
      
      const proxy = http.request({
        hostname: 'localhost',
        port: GRAPHHOPPER_PORT,
        path: req.url,
        method: req.method,
        headers: proxyHeaders
      }, (proxyRes) => {
        // プロキシレスポンスのヘッダーをコピー（CORSヘッダーは除外）
        const responseHeaders = {};
        Object.keys(proxyRes.headers).forEach(key => {
          if (!key.toLowerCase().startsWith('access-control-')) {
            responseHeaders[key] = proxyRes.headers[key];
          }
        });
        
        // CORSヘッダーを確実に設定
        setCorsHeaders(res);
        
        res.writeHead(proxyRes.statusCode, responseHeaders);
        proxyRes.pipe(res);
      });
      
      proxy.on('error', (err) => {
        console.error('Proxy error:', err);
        setCorsHeaders(res);
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('GraphHopper is not responding: ' + err.message);
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

// HTTPサーバーを起動
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Wrapper server running on port ${PORT}`);
  console.log(`GraphHopper will be proxied from port ${GRAPHHOPPER_PORT}`);
  console.log('Environment:', {
    PORT: process.env.PORT,
    JAVA_OPTS: process.env.JAVA_OPTS || '-Xmx1g -Xms256m'
  });
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('HTTP server closed');
    if (graphhopperProcess) {
      graphhopperProcess.kill();
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  if (graphhopperProcess) {
    graphhopperProcess.kill();
  }
  process.exit(0);
});