const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

const s3 = new AWS.S3();

class S3GraphHopperLoader {
  constructor(bucketName) {
    this.bucket = bucketName;
    this.dataDir = '/graphhopper/data';
    this.graphDir = '/graphhopper/graph-cache';
  }

  async downloadFile(s3Key, localPath) {
    console.log(`Downloading ${s3Key} to ${localPath}...`);
    const startTime = Date.now();
    
    try {
      const data = await s3.getObject({
        Bucket: this.bucket,
        Key: s3Key
      }).promise();
      
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      await fs.writeFile(localPath, data.Body);
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Downloaded ${s3Key} in ${elapsed}s`);
      return true;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  async downloadDirectory(s3Prefix, localDir) {
    console.log(`Downloading directory ${s3Prefix} to ${localDir}...`);
    
    const objects = await s3.listObjectsV2({
      Bucket: this.bucket,
      Prefix: s3Prefix
    }).promise();
    
    if (!objects.Contents || objects.Contents.length === 0) {
      return false;
    }
    
    await fs.mkdir(localDir, { recursive: true });
    
    // 並列ダウンロード（最大5つ）
    const downloadPromises = [];
    for (const obj of objects.Contents) {
      const localPath = path.join(localDir, obj.Key.replace(s3Prefix, ''));
      downloadPromises.push(this.downloadFile(obj.Key, localPath));
      
      if (downloadPromises.length >= 5) {
        await Promise.all(downloadPromises);
        downloadPromises.length = 0;
      }
    }
    
    if (downloadPromises.length > 0) {
      await Promise.all(downloadPromises);
    }
    
    return true;
  }

  async uploadDirectory(localDir, s3Prefix) {
    console.log(`Uploading ${localDir} to ${s3Prefix}...`);
    
    const files = await this.getAllFiles(localDir);
    
    for (const file of files) {
      const key = path.join(s3Prefix, path.relative(localDir, file));
      const fileContent = await fs.readFile(file);
      
      await s3.putObject({
        Bucket: this.bucket,
        Key: key,
        Body: fileContent
      }).promise();
      
      console.log(`Uploaded ${key}`);
    }
  }

  async getAllFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async initialize() {
    console.log('Initializing GraphHopper with S3 data...');
    
    // 1. 処理済みグラフが存在するか確認
    const graphCacheKey = `graph-cache/${process.env.GRAPH_PROFILE || 'default'}/`;
    const hasGraph = await this.downloadDirectory(graphCacheKey, this.graphDir);
    
    if (hasGraph) {
      console.log('Using pre-processed graph from S3');
      return true;
    }
    
    // 2. OSMデータをダウンロード
    const osmKey = process.env.OSM_FILE || 'osm-data/japan-latest.osm.pbf';
    const osmPath = path.join(this.dataDir, 'map.osm.pbf');
    
    const hasOsm = await this.downloadFile(osmKey, osmPath);
    if (!hasOsm) {
      throw new Error(`OSM file not found in S3: ${osmKey}`);
    }
    
    // 3. GraphHopperで処理
    console.log('Processing OSM data with GraphHopper...');
    await this.processGraph();
    
    // 4. 処理結果をS3にアップロード
    await this.uploadDirectory(this.graphDir, graphCacheKey);
    
    console.log('GraphHopper initialization complete');
    return true;
  }

  processGraph() {
    return new Promise((resolve, reject) => {
      const graphhopper = spawn('java', [
        '-Xmx4g',
        '-jar',
        'graphhopper.jar',
        'import',
        'config.yml'
      ], {
        cwd: '/graphhopper',
        env: process.env
      });
      
      graphhopper.stdout.on('data', (data) => {
        console.log(`GraphHopper: ${data}`);
      });
      
      graphhopper.stderr.on('data', (data) => {
        console.error(`GraphHopper Error: ${data}`);
      });
      
      graphhopper.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`GraphHopper processing failed with code ${code}`));
        }
      });
    });
  }
}

// エクスポート
module.exports = S3GraphHopperLoader;

// スタンドアロン実行
if (require.main === module) {
  const loader = new S3GraphHopperLoader(process.env.DATA_BUCKET);
  loader.initialize()
    .then(() => console.log('Success'))
    .catch(err => {
      console.error('Failed:', err);
      process.exit(1);
    });
}