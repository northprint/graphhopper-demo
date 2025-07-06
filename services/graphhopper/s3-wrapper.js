const http = require('http');
const { spawn } = require('child_process');
const S3GraphHopperLoader = require('./s3-loader');

// 環境変数
const DATA_BUCKET = process.env.DATA_BUCKET || 'graphhopper-data';
const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const OSM_FILE = process.env.OSM_FILE || 'osm-data/kanto-latest.osm.pbf';
const GRAPH_PROFILE = process.env.GRAPH_PROFILE || 'kanto-car';

let graphhopperProcess = null;
let isGraphHopperRunning = false;
let startupLogs = [];
let initializationError = null;

// S3ローダーの初期化
const s3Loader = new S3GraphHopperLoader(DATA_BUCKET);

// GraphHopperを起動
async function startGraphHopper() {
  console.log('Starting GraphHopper with S3 data...');
  
  try {
    // S3からデータを取得
    process.env.OSM_FILE = OSM_FILE;
    process.env.GRAPH_PROFILE = GRAPH_PROFILE;
    await s3Loader.initialize();
    
    // GraphHopperプロセスを起動
    const javaOpts = process.env.JAVA_OPTS || '-Xmx2g -Xms512m';
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
        console.log('GraphHopper is ready!');
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
  } catch (error) {
    console.error('Failed to initialize GraphHopper:', error);
    initializationError = error.message;
  }
}

// HTTPサーバー
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: initializationError ? 'error' : 'healthy',
      graphhopper: isGraphHopperRunning ? 'running' : 'stopped',
      s3_bucket: DATA_BUCKET,
      osm_file: OSM_FILE,
      graph_profile: GRAPH_PROFILE,
      error: initializationError,
      logs: startupLogs.slice(-20)
    }));
  } else if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('GraphHopper S3 Wrapper Service\n');
  } else {
    // GraphHopperへのプロキシ
    if (isGraphHopperRunning) {
      const proxy = http.request({
        hostname: 'localhost',
        port: 8991,
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
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'GraphHopper is not running yet',
        initialization_error: initializationError,
        logs: startupLogs.slice(-10)
      }));
    }
  }
});

// GraphHopperを起動
startGraphHopper().catch(console.error);

// HTTPサーバーを起動（ポート8990）
server.listen(8990, '0.0.0.0', () => {
  console.log('S3 Wrapper server running on port 8990');
});