<script>
  import Map from '$lib/Map.svelte';
</script>

<div class="container">
  <h1>GraphHopper Demo - 渋谷エリア</h1>
  <p>マップ上で2点をクリックしてルートを表示します</p>
  
  <div class="map-container">
    <Map />
  </div>
  
  <div class="instructions">
    <h2>使い方</h2>
    <ol>
      <li>マップ上で出発地点をクリック（緑のマーカー）</li>
      <li>目的地をクリック（赤のマーカー）</li>
      <li>自動的にルートが表示されます</li>
      <li>新しいルートを作成するには、マップ上の別の場所をクリック</li>
    </ol>
    <p class="note">※ 現在のデータは渋谷駅周辺（約2km四方）のみ対応しています</p>
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .map-container {
    margin: 2rem 0;
    height: 600px;
    border: 2px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .instructions {
    background: #f5f5f5;
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 2rem;
  }
  
  h1 {
    color: var(--primary-color);
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }
  
  ol {
    margin-left: 1.5rem;
  }
  
  li {
    margin: 0.5rem 0;
  }
  
  .note {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #666;
    font-style: italic;
  }
</style>