import { f as current_component, s as setContext, g as getContext, h as attr_class, i as attr_style, j as clsx, k as bind_props, c as pop, p as push, l as copy_payload, m as assign_payload, n as spread_props, o as ensure_array_like, e as escape_html } from "../../chunks/index.js";
import maplibregl from "maplibre-gl";
import { i as is_array, b as get_prototype_of, o as object_prototype } from "../../chunks/utils.js";
const empty = [];
function snapshot(value, skip_warning = false) {
  return clone(value, /* @__PURE__ */ new Map(), "", empty);
}
function clone(value, cloned, path, paths, original = null) {
  if (typeof value === "object" && value !== null) {
    var unwrapped = cloned.get(value);
    if (unwrapped !== void 0) return unwrapped;
    if (value instanceof Map) return (
      /** @type {Snapshot<T>} */
      new Map(value)
    );
    if (value instanceof Set) return (
      /** @type {Snapshot<T>} */
      new Set(value)
    );
    if (is_array(value)) {
      var copy = (
        /** @type {Snapshot<any>} */
        Array(value.length)
      );
      cloned.set(value, copy);
      if (original !== null) {
        cloned.set(original, copy);
      }
      for (var i = 0; i < value.length; i += 1) {
        var element = value[i];
        if (i in value) {
          copy[i] = clone(element, cloned, path, paths);
        }
      }
      return copy;
    }
    if (get_prototype_of(value) === object_prototype) {
      copy = {};
      cloned.set(value, copy);
      if (original !== null) {
        cloned.set(original, copy);
      }
      for (var key in value) {
        copy[key] = clone(value[key], cloned, path, paths);
      }
      return copy;
    }
    if (value instanceof Date) {
      return (
        /** @type {Snapshot<T>} */
        structuredClone(value)
      );
    }
    if (typeof /** @type {T & { toJSON?: any } } */
    value.toJSON === "function") {
      return clone(
        /** @type {T & { toJSON(): any } } */
        value.toJSON(),
        cloned,
        path,
        paths,
        // Associate the instance with the toJSON clone
        value
      );
    }
  }
  if (value instanceof EventTarget) {
    return (
      /** @type {Snapshot<T>} */
      value
    );
  }
  try {
    return (
      /** @type {Snapshot<T>} */
      structuredClone(value)
    );
  } catch (e) {
    return (
      /** @type {Snapshot<T>} */
      value
    );
  }
}
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
const MAP_CONTEXT_KEY = Symbol("MapLibre map context");
const SOURCE_CONTEXT_KEY = Symbol("MapLibre source context");
const LAYER_CONTEXT_KEY = Symbol("MapLibre layer context");
const MARKER_CONTEXT_KEY = Symbol("MapLibre marker context");
class MapContext {
  /** Map instance */
  _map = null;
  /** Callbacks to be called when the map style is loaded */
  _listener = void 0;
  _pending = [];
  /** Names of layers dynamically added */
  userLayers = /* @__PURE__ */ new Set();
  /** Names of sources dynamically added */
  userSources = /* @__PURE__ */ new Set();
  /** Terrain specification of the current base style */
  baseTerrain;
  /** Sky specification set by user */
  userTerrain;
  /** Sky specification of the current base style */
  baseSky;
  /** Sky specification set by user */
  userSky;
  /** Light specification of the current base style */
  baseLight;
  /** Light specification set by user */
  userLight;
  /** Projection specification of the current base style */
  baseProjection;
  /** Projection specification set by user */
  userProjection;
  get map() {
    return this._map;
  }
  set map(value) {
    if (this._listener) {
      this._map?.off("styledata", this._listener);
      this._listener = void 0;
    }
    this._map = value;
    if (this._map) {
      this._listener = this._onstyledata.bind(this);
      this._map.on("styledata", this._listener);
    }
  }
  addLayer(addLayerObject, beforeId) {
    if (!this.map) throw new Error("Map is not initialized");
    this.userLayers.add(addLayerObject.id);
    this.waitForStyleLoaded((map) => {
      map.addLayer(addLayerObject, beforeId);
    });
  }
  removeLayer(id) {
    if (!this.map) throw new Error("Map is not initialized");
    this.userLayers.delete(id);
    this.waitForStyleLoaded((map) => {
      map.removeLayer(id);
    });
  }
  addSource(id, source) {
    this.userSources.add(id);
    this.waitForStyleLoaded((map) => {
      map.addSource(id, source);
    });
  }
  removeSource(id) {
    this.userSources.delete(id);
    this.waitForStyleLoaded((map) => {
      map.removeSource(id);
    });
  }
  /** Wait for the style to be loaded before calling the function */
  waitForStyleLoaded(func) {
    if (!this.map) {
      return;
    }
    if (this.map.style._loaded) {
      func(this.map);
    } else {
      this._pending.push(func);
    }
  }
  _onstyledata(ev) {
    const map = ev.target;
    if (map?.style._loaded) {
      for (const func of this._pending) {
        func(map);
      }
      this._pending = [];
    }
  }
  setStyle(style) {
    const {
      userSources: addedSources,
      userLayers: addedLayers
    } = this;
    if (!style) {
      this.map?.setStyle(null);
      return;
    }
    this.map?.setStyle(snapshot(style), {
      // Preserves user styles when the base style changes
      transformStyle: (previous, next) => {
        this.baseLight = next.light;
        this.baseProjection = next.projection;
        this.baseSky = next.sky;
        this.baseTerrain = next.terrain;
        if (!previous) {
          return next;
        }
        const sources = next.sources;
        for (const [key, value] of Object.entries(previous.sources)) {
          if (addedSources.has(key)) {
            sources[key] = value;
          }
        }
        const userLayers = previous.layers.filter((layer) => addedLayers.has(layer.id));
        const layers = [...next.layers, ...userLayers];
        return {
          ...next,
          light: this.userLight || this.baseLight,
          projection: this.userProjection || this.baseProjection,
          sky: this.userSky || this.baseSky,
          terrain: this.userTerrain || this.baseTerrain,
          sources,
          layers
        };
      }
    });
  }
}
function prepareMapContext() {
  const mapCtx = new MapContext();
  setContext(MAP_CONTEXT_KEY, mapCtx);
  return mapCtx;
}
function getMapContext() {
  const mapCtx = getContext(MAP_CONTEXT_KEY);
  if (!mapCtx) throw new Error("Map context not found");
  return mapCtx;
}
class SourceContext {
  /** sourceId */
  id = "";
}
function prepareSourceContext() {
  const sourceCtx = new SourceContext();
  setContext(SOURCE_CONTEXT_KEY, sourceCtx);
  return sourceCtx;
}
function getSourceContext() {
  const sourceCtx = getContext(SOURCE_CONTEXT_KEY);
  if (!sourceCtx || !sourceCtx.id) throw new Error("Source context not found");
  return sourceCtx;
}
class LayerContext {
  id = "";
}
function prepareLayerContext() {
  const layerCtx = new LayerContext();
  setContext(LAYER_CONTEXT_KEY, layerCtx);
  return layerCtx;
}
class MarkerContext {
  marker = null;
}
function prepareMarkerContext() {
  const markerCtx = new MarkerContext();
  setContext(MARKER_CONTEXT_KEY, markerCtx);
  return markerCtx;
}
let layerIdCounter = 0;
let sourceIdCounter = 0;
function generateLayerID() {
  return `svmlgl-layer-${layerIdCounter++}`;
}
function generateSourceID() {
  return `svmlgl-source-${sourceIdCounter++}`;
}
function MapLibre($$payload, $$props) {
  push();
  let {
    map = void 0,
    class: className = "",
    inlineStyle = "",
    children,
    autoloadGlobalCss = true,
    // Events
    // https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/
    onerror,
    onload,
    onidle,
    onremove,
    onrender,
    onresize,
    onwebglcontextlost,
    onwebglcontextrestored,
    ondataloading,
    ondata,
    ontiledataloading,
    onsourcedataloading,
    onstyledataloading,
    onsourcedata,
    onstyledata,
    onstyleimagemissing,
    ondataabort,
    onsourcedataabort,
    onboxzoomcancel,
    onboxzoomstart,
    onboxzoomend,
    ontouchcancel,
    ontouchmove,
    ontouchend,
    ontouchstart,
    onclick,
    oncontextmenu,
    ondblclick,
    onmousemove,
    onmouseup,
    onmousedown,
    onmouseout,
    onmouseover,
    onmovestart,
    onmove,
    onmoveend,
    onzoomstart,
    onzoom,
    onzoomend,
    onrotatestart,
    onrotate,
    onrotateend,
    ondragstart,
    ondrag,
    ondragend,
    onpitchstart,
    onpitch,
    onpitchend,
    onwheel,
    onterrain,
    oncooperativegestureprevented,
    onprojectiontransition,
    // Others
    padding = { top: 0, bottom: 0, left: 0, right: 0 },
    fov,
    cursor,
    // Accessors
    showTileBoundaries,
    showPadding,
    showCollisionBoxes,
    showOverdrawInspector,
    repaint,
    vertices,
    // Map Options (reactive)
    bearing = void 0,
    bearingSnap,
    center = void 0,
    centerClampedToGround,
    elevation = void 0,
    interactive = void 0,
    maxBounds,
    maxPitch,
    maxZoom,
    minPitch,
    minZoom,
    pitch = void 0,
    pixelRatio,
    renderWorldCopies,
    roll = void 0,
    style = { version: 8, sources: {}, layers: [] },
    transformRequest,
    zoom = void 0,
    // Map Options (properties)
    boxZoom,
    cancelPendingTileRequestsWhileZooming,
    cooperativeGestures,
    doubleClickZoom,
    dragPan,
    dragRotate,
    keyboard,
    scrollZoom,
    touchPitch,
    touchZoomRotate,
    transformCameraUpdate,
    // Global state
    globalState = {},
    $$slots,
    $$events,
    // Map Options (others)
    ...restOptions
  } = $$props;
  if (autoloadGlobalCss && globalThis.window && !document.querySelector('link[href$="/maplibre-gl.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://unpkg.com/maplibre-gl@${maplibregl.getVersion()}/dist/maplibre-gl.css`;
    document.head.appendChild(link);
  }
  const mapCtx = prepareMapContext();
  onDestroy(() => {
    mapCtx.map = null;
    map?.remove();
    map = void 0;
  });
  $$payload.out += `<div${attr_class(clsx(className))}${attr_style(inlineStyle)}>`;
  if (map) {
    $$payload.out += "<!--[-->";
    children?.($$payload, map);
    $$payload.out += `<!---->`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, {
    map,
    bearing,
    center,
    elevation,
    pitch,
    roll,
    zoom
  });
  pop();
}
function RawSource($$payload, $$props) {
  push();
  let {
    source = void 0,
    id: _id,
    children,
    $$slots,
    $$events,
    ...spec
  } = $$props;
  spec = spec;
  const mapCtx = getMapContext();
  if (!mapCtx.map) throw new Error("Map instance is not initialized.");
  const id = _id ?? generateSourceID();
  const sourceCtx = prepareSourceContext();
  sourceCtx.id = id;
  mapCtx.waitForStyleLoaded((map) => {
    mapCtx.addSource(id, snapshot(spec));
    source = map.getSource(id);
  });
  onDestroy(() => {
    mapCtx.removeSource(id);
    source = void 0;
  });
  children?.($$payload);
  $$payload.out += `<!---->`;
  bind_props($$props, { source });
  pop();
}
function GeoJSONSource($$payload, $$props) {
  push();
  let {
    source = void 0,
    id,
    children,
    $$slots,
    $$events,
    ...spec
  } = $$props;
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    RawSource($$payload2, spread_props([
      { id, type: "geojson" },
      spec,
      {
        get source() {
          return source;
        },
        set source($$value) {
          source = $$value;
          $$settled = false;
        },
        children: ($$payload3) => {
          children?.($$payload3);
          $$payload3.out += `<!---->`;
        },
        $$slots: { default: true }
      }
    ]));
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  bind_props($$props, { source });
  pop();
}
function RawLayer($$payload, $$props) {
  push();
  let {
    id: _id,
    source: sourceId,
    beforeId,
    type,
    paint,
    layout,
    filter,
    "source-layer": sourceLayer,
    maxzoom,
    minzoom,
    metadata,
    children,
    // Events
    // https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/
    onclick,
    ondblclick,
    onmousedown,
    onmouseup,
    onmousemove,
    onmouseenter,
    onmouseleave,
    onmouseover,
    onmouseout,
    oncontextmenu,
    ontouchstart,
    ontouchend,
    ontouchcancel
  } = $$props;
  const mapCtx = getMapContext();
  if (!mapCtx.map) throw new Error("Map instance is not initialized.");
  const id = _id ?? generateLayerID();
  const layerCtx = prepareLayerContext();
  layerCtx.id = id;
  const addLayerObj = {
    id,
    type,
    layout: snapshot(layout) ?? {},
    paint: snapshot(paint) ?? {}
  };
  if (addLayerObj.type !== "background") {
    addLayerObj.source = sourceId ?? getSourceContext().id;
  }
  if (maxzoom !== void 0) {
    addLayerObj.maxzoom = maxzoom;
  }
  if (minzoom !== void 0) {
    addLayerObj.minzoom = minzoom;
  }
  if (metadata !== void 0) {
    addLayerObj.metadata = metadata;
  }
  if (addLayerObj.type !== "background") {
    if (sourceLayer) {
      addLayerObj["source-layer"] = sourceLayer;
    }
    if (filter) {
      addLayerObj.filter = snapshot(filter);
    }
  }
  mapCtx.waitForStyleLoaded(() => {
    mapCtx.addLayer(addLayerObj, beforeId);
  });
  snapshot(paint) ?? {};
  snapshot(layout) ?? {};
  onDestroy(() => {
    mapCtx.removeLayer(id);
  });
  children?.($$payload);
  $$payload.out += `<!---->`;
  pop();
}
function LineLayer($$payload, $$props) {
  let {
    children,
    sourceLayer,
    $$slots,
    $$events,
    ...props
  } = $$props;
  RawLayer($$payload, spread_props([
    { type: "line", "source-layer": sourceLayer },
    props,
    {
      children: ($$payload2) => {
        children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
}
function Marker($$payload, $$props) {
  push();
  let {
    lnglat = void 0,
    class: className = void 0,
    draggable,
    rotation,
    rotationAlignment,
    pitchAlignment,
    opacity,
    color,
    opacityWhenCovered,
    offset,
    subpixelPositioning,
    content,
    children,
    ondrag,
    ondragstart,
    ondragend,
    $$slots,
    $$events,
    ...restOptions
  } = $$props;
  const mapCtx = getMapContext();
  if (!mapCtx.map) throw new Error("Map instance is not initialized.");
  prepareMarkerContext();
  onDestroy(() => {
  });
  if (content) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div>`;
    content($$payload);
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  children?.($$payload);
  $$payload.out += `<!---->`;
  bind_props($$props, { lnglat });
  pop();
}
const PUBLIC_GRAPHHOPPER_URL = "http://localhost:8989";
class GraphHopperClient {
  baseUrl;
  constructor(baseUrl = PUBLIC_GRAPHHOPPER_URL) {
    this.baseUrl = baseUrl;
  }
  /**
   * Calculate route between points
   */
  async route(request) {
    const params = new URLSearchParams();
    request.points.forEach((point) => {
      params.append("point", `${point[0]},${point[1]}`);
    });
    if (request.profile) params.append("profile", request.profile);
    if (request.locale) params.append("locale", request.locale);
    if (request.instructions !== void 0) {
      params.append("instructions", String(request.instructions));
    }
    if (request.calc_points !== void 0) {
      params.append("calc_points", String(request.calc_points));
    }
    if (request.points_encoded !== void 0) {
      params.append("points_encoded", String(request.points_encoded));
    }
    if (request.elevation !== void 0) {
      params.append("elevation", String(request.elevation));
    }
    const response = await fetch(`${this.baseUrl}/route?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`GraphHopper API error: ${response.statusText}`);
    }
    return response.json();
  }
  /**
   * Get information about the GraphHopper instance
   */
  async info() {
    const response = await fetch(`${this.baseUrl}/info`);
    if (!response.ok) {
      throw new Error(`GraphHopper API error: ${response.statusText}`);
    }
    return response.json();
  }
  /**
   * Check health status
   */
  async health() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
const graphhopper = new GraphHopperClient();
function Map$1($$payload, $$props) {
  push();
  let markers = [];
  let routeData = null;
  let routeInfo = { distance: "", time: "" };
  const DEFAULT_CENTER = [139.7025, 35.6595];
  const DEFAULT_ZOOM = 15;
  async function handleMapClick(e) {
    console.log("Click event:", e);
    let lng, lat;
    if (e && typeof e === "object") {
      if (e.lngLat) {
        ({ lng, lat } = e.lngLat);
      } else if (e.detail?.lngLat) {
        ({ lng, lat } = e.detail.lngLat);
      } else if (e.detail && typeof e.detail === "object") {
        ({ lng, lat } = e.detail);
      }
    }
    if (!lng || !lat) {
      console.error("座標を取得できませんでした。イベント構造:", {
        event: e,
        hasLngLat: !!e?.lngLat,
        hasDetail: !!e?.detail,
        detailContent: e?.detail
      });
      return;
    }
    if (markers.length >= 2) {
      markers = [];
      routeData = null;
      routeInfo = { distance: "", time: "" };
    }
    const newMarker = { lat, lng };
    console.log("新しいマーカーを追加:", newMarker);
    markers = [...markers, newMarker];
    if (markers.length === 2) {
      try {
        const route = await graphhopper.route({
          points: [
            [markers[0].lat, markers[0].lng],
            [markers[1].lat, markers[1].lng]
          ],
          profile: "car",
          points_encoded: false
        });
        if (route.paths && route.paths.length > 0) {
          const path = route.paths[0];
          routeData = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: path.points.coordinates
            }
          };
          const distance = (path.distance / 1e3).toFixed(2);
          const time = Math.round(path.time / 1e3 / 60);
          routeInfo = { distance: `${distance}km`, time: `${time}分` };
        }
      } catch (error) {
        console.error("ルート計算エラー:", error);
        alert("ルート計算に失敗しました。GraphHopperが起動していることを確認してください。");
      }
    }
  }
  $$payload.out += `<div class="map-container svelte-kohymh">`;
  MapLibre($$payload, {
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: [
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      },
      layers: [{ id: "osm", type: "raster", source: "osm" }]
    },
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    onclick: handleMapClick,
    class: "map",
    children: ($$payload2) => {
      const each_array = ensure_array_like(markers);
      $$payload2.out += `<!--[-->`;
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let marker = each_array[i];
        Marker($$payload2, {
          lnglat: [marker.lng, marker.lat],
          color: i === 0 ? "#22c55e" : "#ef4444",
          children: ($$payload3) => {
            $$payload3.out += `<div class="marker-content svelte-kohymh">${escape_html(i === 0 ? "出発" : "到着")}</div>`;
          },
          $$slots: { default: true }
        });
      }
      $$payload2.out += `<!--]--> `;
      if (routeData) {
        $$payload2.out += "<!--[-->";
        GeoJSONSource($$payload2, {
          id: "route",
          data: routeData,
          children: ($$payload3) => {
            LineLayer($$payload3, {
              id: "route-layer",
              paint: {
                "line-color": "#3b82f6",
                "line-width": 5,
                "line-opacity": 0.8
              },
              layout: { "line-join": "round", "line-cap": "round" }
            });
          },
          $$slots: { default: true }
        });
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]-->`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  if (routeInfo.distance) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="route-info svelte-kohymh">距離: ${escape_html(routeInfo.distance)} | 時間: ${escape_html(routeInfo.time)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function _page($$payload) {
  $$payload.out += `<div class="container svelte-1xeqfl4"><h1 class="svelte-1xeqfl4">GraphHopper Demo - 渋谷エリア</h1> <p>マップ上で2点をクリックしてルートを表示します</p> <div class="map-container svelte-1xeqfl4">`;
  Map$1($$payload);
  $$payload.out += `<!----></div> <div class="instructions svelte-1xeqfl4"><h2 class="svelte-1xeqfl4">使い方</h2> <ol class="svelte-1xeqfl4"><li class="svelte-1xeqfl4">マップ上で出発地点をクリック（緑のマーカー）</li> <li class="svelte-1xeqfl4">目的地をクリック（赤のマーカー）</li> <li class="svelte-1xeqfl4">自動的にルートが表示されます</li> <li class="svelte-1xeqfl4">新しいルートを作成するには、マップ上の別の場所をクリック</li></ol> <p class="note svelte-1xeqfl4">※ 現在のデータは渋谷駅周辺（約2km四方）のみ対応しています</p></div></div>`;
}
export {
  _page as default
};
