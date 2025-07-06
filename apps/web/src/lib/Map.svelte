<script lang="ts">
  import { MapLibre, Marker, GeoJSONSource, LineLayer } from 'svelte-maplibre-gl';
  import { graphhopper } from './graphhopper';
  
  let markers = $state<{ lat: number; lng: number }[]>([]);
  let routeData: any = $state(null);
  let routeInfo = $state({ distance: '', time: '' });
  
  // 渋谷駅の座標
  const DEFAULT_CENTER: [number, number] = [139.7025, 35.6595];
  const DEFAULT_ZOOM = 15;
  
  async function handleMapClick(e: any) {
    console.log('Click event:', e);
    
    // MapLibre GLのクリックイベントから座標を取得
    let lng, lat;
    
    // イベントオブジェクトの構造を確認
    if (e && typeof e === 'object') {
      if (e.lngLat) {
        ({ lng, lat } = e.lngLat);
      } else if (e.detail?.lngLat) {
        ({ lng, lat } = e.detail.lngLat);
      } else if (e.detail && typeof e.detail === 'object') {
        // detail直下にlng/latがある場合
        ({ lng, lat } = e.detail);
      }
    }
    
    if (!lng || !lat) {
      console.error('座標を取得できませんでした。イベント構造:', {
        event: e,
        hasLngLat: !!(e?.lngLat),
        hasDetail: !!(e?.detail),
        detailContent: e?.detail
      });
      return;
    }
    
    // 既に2つのマーカーがある場合はリセット
    if (markers.length >= 2) {
      markers = [];
      routeData = null;
      routeInfo = { distance: '', time: '' };
    }
    
    const newMarker = { lat, lng };
    console.log('新しいマーカーを追加:', newMarker);
    markers = [...markers, newMarker];
    
    if (markers.length === 2) {
      // 2点間のルートを計算
      try {
        const route = await graphhopper.route({
          points: [
            [markers[0].lat, markers[0].lng],
            [markers[1].lat, markers[1].lng]
          ],
          profile: 'car',
          points_encoded: false
        });
        
        if (route.paths && route.paths.length > 0) {
          const path = route.paths[0];
          
          // GeoJSON形式でルートを作成
          routeData = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: path.points.coordinates
            }
          };
          
          // 距離と時間を計算
          const distance = (path.distance / 1000).toFixed(2);
          const timeInSeconds = path.time / 1000;
          const minutes = Math.floor(timeInSeconds / 60);
          const seconds = Math.round(timeInSeconds % 60);
          
          // 1分未満の場合は秒で表示、それ以外は分と秒で表示
          const timeDisplay = minutes > 0 
            ? `${minutes}分${seconds}秒`
            : `${seconds}秒`;
          
          routeInfo = { distance: `${distance}km`, time: timeDisplay };
        }
      } catch (error) {
        console.error('ルート計算エラー:', error);
        alert('ルート計算に失敗しました。GraphHopperが起動していることを確認してください。');
      }
      
      // ルート計算成功後はマーカーを残す（ルートの開始・終了地点として）
      // 次のクリックでリセットされる
    }
  }
</script>

<div class="map-container">
  <MapLibre
    style={{
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm'
        }
      ]
    }}
    center={DEFAULT_CENTER}
    zoom={DEFAULT_ZOOM}
    onclick={handleMapClick}
    class="map"
  >
    {#each markers as marker, i (i)}
      <Marker 
        lnglat={[marker.lng, marker.lat]}
        color={i === 0 ? '#22c55e' : '#ef4444'}
      >
        <div class="marker-content">
          {i === 0 ? '出発' : '到着'}
        </div>
      </Marker>
    {/each}
    
    {#if routeData}
      <GeoJSONSource id="route" data={routeData}>
        <LineLayer
          id="route-layer"
          paint={{
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.8
          }}
          layout={{
            'line-join': 'round',
            'line-cap': 'round'
          }}
        />
      </GeoJSONSource>
    {/if}
  </MapLibre>
  
  {#if routeInfo.distance}
    <div class="route-info">
      距離: {routeInfo.distance} | 時間: {routeInfo.time}
    </div>
  {/if}
</div>

<style>
  .map-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 500px;
  }
  
  :global(.map) {
    width: 100%;
    height: 100%;
  }
  
  .route-info {
    position: absolute;
    top: 10px;
    left: 10px;
    background: white;
    padding: 10px 15px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    font-weight: 600;
    z-index: 1;
  }
  
  .marker-content {
    background: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
  }
</style>