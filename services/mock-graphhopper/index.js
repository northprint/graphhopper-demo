const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// ルート計算エンドポイント
app.get('/route', (req, res) => {
  const points = req.query.point;
  
  if (!points || points.length < 2) {
    return res.status(400).json({ error: 'At least 2 points required' });
  }
  
  // ポイントをパース
  const parsedPoints = Array.isArray(points) ? points : [points];
  const coordinates = parsedPoints.map(p => {
    const [lat, lng] = p.split(',').map(Number);
    return [lng, lat]; // GeoJSONは[lng, lat]の順
  });
  
  // モックルートを生成（単純な直線）
  const distance = calculateDistance(coordinates[0], coordinates[coordinates.length - 1]);
  const time = Math.round(distance / 50 * 3600); // 50km/hで計算
  
  res.json({
    paths: [{
      distance: distance * 1000, // メートルに変換
      time: time * 1000, // ミリ秒に変換
      points: {
        type: 'LineString',
        coordinates: coordinates
      },
      instructions: []
    }]
  });
});

// 距離計算（簡易版）
function calculateDistance(coord1, coord2) {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const R = 6371; // 地球の半径 (km)
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

const PORT = 8989;
app.listen(PORT, () => {
  console.log(`Mock GraphHopper server running on port ${PORT}`);
});