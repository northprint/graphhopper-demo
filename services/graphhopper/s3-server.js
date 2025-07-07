const http = require('http');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const execAsync = promisify(exec);

// GraphHopperプロセスを保持
let graphhopperProcess = null;
let isGraphHopperRunning = false;
let startupLogs = [];

// App Runnerは環境変数PORTを設定する
const PORT = process.env.PORT || 8000;
const GRAPHHOPPER_PORT = 8991;

// S3クライアント
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' });

// S3からgraph-cacheをダウンロード
async function downloadGraphCache() {
  const bucket = process.env.S3_BUCKET;
  const mapKey = process.env.S3_KEY || 'kanto-latest.osm.pbf';
  const cacheKey = `cache/${mapKey.replace('.osm.pbf', '')}-graph-cache.tar.gz`;
  const graphCachePath = '/graphhopper/graph-cache';
  const tempPath = '/tmp/graph-cache.tar.gz';

  if (!bucket || process.env.DISABLE_CACHE === 'true') {
    console.log('Graph cache disabled or S3_BUCKET not set');
    return false;
  }

  try {
    // キャッシュが存在するか確認
    const headCommand = new HeadObjectCommand({ Bucket: bucket, Key: cacheKey });
    await s3Client.send(headCommand);
    console.log(`Found graph cache at s3://${bucket}/${cacheKey}`);

    // S3からダウンロード
    console.log('Downloading graph cache...');
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: cacheKey });
    const response = await s3Client.send(getCommand);
    
    // ストリームを書き込み
    const writeStream = fs.createWriteStream(tempPath);
    await pipeline(response.Body, writeStream);
    
    // 既存のgraph-cacheを削除
    if (fs.existsSync(graphCachePath)) {
      await execAsync(`rm -rf ${graphCachePath}`);
    }
    
    // tar.gzを展開
    console.log('Extracting graph cache...');
    await execAsync(`cd /graphhopper && tar -xzf ${tempPath}`);
    
    // 一時ファイルを削除
    fs.unlinkSync(tempPath);
    
    console.log('Graph cache restored successfully');
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      console.log('No graph cache found in S3');
    } else {
      console.error('Failed to download graph cache:', error);
    }
    return false;
  }
}

// graph-cacheをS3にアップロード
async function uploadGraphCache() {
  const bucket = process.env.S3_BUCKET;
  const mapKey = process.env.S3_KEY || 'kanto-latest.osm.pbf';
  const cacheKey = `cache/${mapKey.replace('.osm.pbf', '')}-graph-cache.tar.gz`;
  const graphCachePath = '/graphhopper/graph-cache';
  const tempPath = '/tmp/graph-cache.tar.gz';

  if (!bucket || process.env.DISABLE_CACHE === 'true') {
    console.log('Graph cache upload disabled');
    return;
  }

  try {
    // graph-cacheが存在するか確認
    if (!fs.existsSync(graphCachePath)) {
      console.log('No graph cache to upload');
      return;
    }

    console.log('Creating graph cache archive...');
    await execAsync(`cd /graphhopper && tar -czf ${tempPath} graph-cache`);
    
    // S3にアップロード
    console.log(`Uploading graph cache to s3://${bucket}/${cacheKey}...`);
    const fileStream = fs.createReadStream(tempPath);
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: cacheKey,
      Body: fileStream,
      ContentType: 'application/gzip'
    });
    await s3Client.send(putCommand);
    
    // 一時ファイルを削除
    fs.unlinkSync(tempPath);
    
    console.log('Graph cache uploaded successfully');
  } catch (error) {
    console.error('Failed to upload graph cache:', error);
  }
}

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
  
  try {
    // キャッシュをダウンロード試行
    const cacheRestored = await downloadGraphCache();
    
    if (!cacheRestored) {
      // キャッシュがない場合はOSMデータをダウンロード
      await downloadMapData();
    }
    
    const javaOpts = process.env.JAVA_OPTS || '-Xmx3g -Xms512m';
    graphhopperProcess = spawn('java', [...javaOpts.split(' '), '-jar', 'graphhopper.jar', 'server', 'config-apprunner.yml'], {
      cwd: '/graphhopper',
      env: process.env
    });

    let graphInitialized = false;

    graphhopperProcess.stdout.on('data', (data) => {
      const log = data.toString();
      console.log('GraphHopper:', log);
      startupLogs.push(log);
      
      // GraphHopperが起動完了したことを検知
      if (log.includes('Started @') || log.includes('Server started')) {
        isGraphHopperRunning = true;
        
        // 初回起動時（キャッシュがなかった場合）はキャッシュをアップロード
        if (!cacheRestored && !graphInitialized) {
          graphInitialized = true;
          setTimeout(() => {
            uploadGraphCache().catch(err => console.error('Cache upload failed:', err));
          }, 5000); // 5秒待ってからアップロード
        }
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
  } catch (error) {
    console.error('Failed to start GraphHopper:', error);
    throw error;
  }
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