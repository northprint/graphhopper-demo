const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

// GraphHopperプロセスを保持
let graphhopperProcess = null;
let isGraphHopperRunning = false;
let startupLogs = [];

// App Runnerは環境変数PORTを設定する
const PORT = process.env.PORT || 8000;
const GRAPHHOPPER_PORT = 8991;

// S3クライアント
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' });

// S3からOSMデータをダウンロード
async function downloadMapData() {
  const bucket = process.env.S3_BUCKET;
  const key = process.env.S3_KEY || 'kanto-latest.osm.pbf';
  const localPath = '/graphhopper/data/map.osm.pbf';

  if (!bucket) {
    console.log('S3_BUCKET not set, using local data');
    return;
  }

  // 既にファイルが存在する場合はスキップ
  if (fs.existsSync(localPath)) {
    console.log('Map data already exists, skipping download');
    return;
  }

  console.log(`Downloading map data from s3://${bucket}/${key}...`);
  
  try {
    // ディレクトリを作成
    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    // S3からダウンロード
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);
    
    // ストリームを書き込み
    const writeStream = fs.createWriteStream(localPath);
    await pipeline(response.Body, writeStream);
    
    console.log('Map data downloaded successfully');
  } catch (error) {
    console.error('Failed to download map data:', error);
    throw error;
  }
}

// GraphHopperを起動
async function startGraphHopper() {
  console.log('Starting GraphHopper...');
  
  // S3からデータをダウンロード
  await downloadMapData();
  
  const javaOpts = process.env.JAVA_OPTS || '-Xmx3g -Xms512m';
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
      s3_bucket: process.env.S3_BUCKET || 'not configured',
      logs: startupLogs.slice(-20)
    }));
  } else if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('GraphHopper S3 Wrapper Service\n');
  } else {
    // GraphHopperへのプロキシ
    if (isGraphHopperRunning) {
      const proxyHeaders = Object.assign({}, req.headers);
      delete proxyHeaders.host;
      
      const proxy = http.request({
        hostname: 'localhost',
        port: GRAPHHOPPER_PORT,
        path: req.url,
        method: req.method,
        headers: proxyHeaders
      }, (proxyRes) => {
        const responseHeaders = {};
        Object.keys(proxyRes.headers).forEach(key => {
          if (!key.toLowerCase().startsWith('access-control-')) {
            responseHeaders[key] = proxyRes.headers[key];
          }
        });
        
        // CORSヘッダーを再設定
        setCorsHeaders(res);
        
        res.writeHead(proxyRes.statusCode, responseHeaders);
        proxyRes.pipe(res);
      });
      
      proxy.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('GraphHopper is not responding: ' + err.message);
      });
      
      req.pipe(proxy);
    } else {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('GraphHopper is starting... Please wait a few minutes.');
    }
  }
});

// GraphHopperを起動
startGraphHopper().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});

// HTTPサーバーを起動
server.listen(PORT, '0.0.0.0', () => {
  console.log(`S3 Wrapper server running on port ${PORT}`);
  console.log(`GraphHopper will be proxied from port ${GRAPHHOPPER_PORT}`);
  console.log('Environment:', {
    PORT: process.env.PORT,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_KEY: process.env.S3_KEY,
    AWS_REGION: process.env.AWS_REGION,
    JAVA_OPTS: process.env.JAVA_OPTS || '-Xmx3g -Xms512m'
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