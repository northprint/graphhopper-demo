<script lang="ts">
  import { MapLibre, Marker, GeoJSONSource, LineLayer } from 'svelte-maplibre-gl';
  import { graphhopper } from './graphhopper';
  
  let markers = $state<{ lat: number; lng: number; type: 'start' | 'end' | 'waypoint' }[]>([]);
  let routeData: any = $state(null);
  let routeInfo = $state({ distance: '', time: '' });
  let mode = $state<'normal' | 'waypoint'>('normal');
  
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
    
    if (mode === 'normal') {
      // 通常モード：出発地と目的地のみ
      if (markers.length >= 2) {
        markers = [];
        routeData = null;
        routeInfo = { distance: '', time: '' };
      }
      
      const type = markers.length === 0 ? 'start' : 'end';
      const newMarker = { lat, lng, type };
      console.log('新しいマーカーを追加:', newMarker);
      markers = [...markers, newMarker];
      
      if (markers.length === 2) {
        await calculateRoute();
      }
    } else {
      // 経由地追加モード
      if (markers.length === 0) {
        // 最初のクリックは出発地
        markers = [{ lat, lng, type: 'start' }];
      } else if (!markers.find(m => m.type === 'end')) {
        // 目的地がまだない場合、経由地として追加
        const lastMarker = markers[markers.length - 1];
        if (lastMarker.type === 'start' || lastMarker.type === 'waypoint') {
          markers = [...markers, { lat, lng, type: 'waypoint' }];
        }
      }
    }
  }
  
  async function calculateRoute() {
    if (markers.length < 2) return;
    
    // ルートを計算
      try {
        const route = await graphhopper.route({
          points: markers.map(m => [m.lat, m.lng]),
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
  }
  
  function setEndpoint() {
    if (markers.length > 0 && markers[markers.length - 1].type === 'waypoint') {
      // 最後の経由地を目的地に変更
      markers[markers.length - 1].type = 'end';
      markers = [...markers];
      calculateRoute();
    }
  }
  
  function clearRoute() {
    markers = [];
    routeData = null;
    routeInfo = { distance: '', time: '' };
  }
  
  function toggleMode() {
    mode = mode === 'normal' ? 'waypoint' : 'normal';
    clearRoute();
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
        color={marker.type === 'start' ? '#22c55e' : marker.type === 'end' ? '#ef4444' : '#3b82f6'}
      >
        <div class="marker-content">
          {marker.type === 'start' ? '出発' : marker.type === 'end' ? '到着' : `経由${markers.filter(m => m.type === 'waypoint').indexOf(marker) + 1}`}
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
  
  <div class="controls">
    <button onclick={toggleMode} class={mode === 'waypoint' ? 'active' : ''}>
      {mode === 'normal' ? '経由地モード' : '通常モード'}
    </button>
    {#if mode === 'waypoint' && markers.length > 0 && !markers.find(m => m.type === 'end')}
      <button onclick={setEndpoint} class="primary">
        目的地を設定
      </button>
    {/if}
    {#if markers.length > 0}
      <button onclick={clearRoute} class="danger">
        クリア
      </button>
    {/if}
    {#if mode === 'waypoint'}
      <div class="mode-info">
        クリックして経由地を追加し、最後に「目的地を設定」を押してください
      </div>
    {/if}
  </div>
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
  
  .controls {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    align-items: center;
    background: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1;
  }
  
  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    background: #f3f4f6;
    color: #374151;
    transition: all 0.2s;
  }
  
  button:hover {
    background: #e5e7eb;
  }
  
  button.active {
    background: #3b82f6;
    color: white;
  }
  
  button.primary {
    background: #10b981;
    color: white;
  }
  
  button.primary:hover {
    background: #059669;
  }
  
  button.danger {
    background: #ef4444;
    color: white;
  }
  
  button.danger:hover {
    background: #dc2626;
  }
  
  .mode-info {
    font-size: 13px;
    color: #6b7280;
    margin-left: 10px;
  }
</style>