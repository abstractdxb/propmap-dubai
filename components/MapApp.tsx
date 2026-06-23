'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { DEVELOPER_COLORS, devColor } from '@/lib/data';
import type { DLDTransaction, DLDRent } from '@/lib/server/dld-client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend);

// ─── Types ───────────────────────────────────────────────────────────────────

type Plan     = 'free' | 'pro' | 'admin';
type MapStyle = 'dark' | 'satellite' | 'streets';
type ActiveTab = 'overview' | 'transactions' | 'trends';

interface AreaFeature {
  id:          string;
  name:        string;
  dldAreaId:   string;
  dldAreaName: string;
  lat:         number;
  lng:         number;
  hasDLD:      boolean;
}

interface Filters {
  areas:     string[];
  propTypes: string[];
  txTypes:   string[];
}

// GeoJSON types for our area features
interface AreaGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: {
      id: string; name: string;
      dldAreaId: string; dldAreaName: string; hasDLD: boolean;
    };
  }>;
}

const EMPTY_FILTERS: Filters = { areas: [], propTypes: [], txTypes: [] };

const MAP_STYLES: Record<MapStyle, string> = {
  dark:      'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  streets:   'mapbox://styles/mapbox/streets-v12',
};

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(42,48,64,0.5)' } },
    y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(42,48,64,0.5)' } },
  },
};

const PROP_TYPES = ['Apartment', 'Villa', 'Townhouse', 'Office'];
const TX_TYPES   = ['Sales', 'Rentals', 'Mortgages'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Chart helpers (computed from live DLD data) ──────────────────────────────

function parseYearMonth(dateStr: string): string {
  if (!dateStr) return '';
  // DLD format: "DD/MM/YYYY ..." or "YYYY-MM-DD ..."
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
    const parts = dateStr.split('/');
    return `${parts[2].slice(0, 4)}-${parts[1]}`;
  }
  return dateStr.slice(0, 7);
}

function ymLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTHS_SHORT[parseInt(m) - 1]} '${y?.slice(2)}`;
}

function computeStats(txs: DLDTransaction[]) {
  const total = txs[0]?.TOTAL ?? txs.length;
  const sales = txs.filter(t => !t.TRANSACTION_TYPE_EN?.toLowerCase().includes('rent') && t.AMOUNT > 0);
  const withSize = sales.filter(t => t.PROPERTY_SIZE_SQM > 0);
  const avgPsf = withSize.length
    ? Math.round(withSize.reduce((s, t) => s + t.AMOUNT / (t.PROPERTY_SIZE_SQM * 10.764), 0) / withSize.length)
    : 0;
  const avgPrice = sales.length
    ? Math.round(sales.reduce((s, t) => s + t.AMOUNT, 0) / sales.length)
    : 0;
  const mostRecent = txs[0]?.INSTANCE_DATE?.slice(0, 10) ?? '—';
  return { total, avgPsf, avgPrice, mostRecent };
}

function psfTrendChart(txs: DLDTransaction[]) {
  const byMonth: Record<string, number[]> = {};
  txs.forEach(t => {
    if (!t.AMOUNT || !t.PROPERTY_SIZE_SQM) return;
    const ym = parseYearMonth(t.INSTANCE_DATE);
    if (!ym) return;
    const psf = t.AMOUNT / (t.PROPERTY_SIZE_SQM * 10.764);
    if (psf > 50 && psf < 25000) {
      if (!byMonth[ym]) byMonth[ym] = [];
      byMonth[ym].push(psf);
    }
  });
  const sorted = Object.keys(byMonth).sort().slice(-12);
  return {
    labels: sorted.map(ymLabel),
    datasets: [{
      label: 'AED/sqft',
      data: sorted.map(m => Math.round(byMonth[m].reduce((s, v) => s + v, 0) / byMonth[m].length)),
      borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)',
      fill: true, tension: 0.4, pointRadius: 3,
    }],
  };
}

function volumeChart(txs: DLDTransaction[]) {
  const sales: Record<string, number> = {};
  const rents: Record<string, number> = {};
  txs.forEach(t => {
    const ym = parseYearMonth(t.INSTANCE_DATE);
    if (!ym) return;
    if (t.TRANSACTION_TYPE_EN?.toLowerCase().includes('rent'))
      rents[ym] = (rents[ym] ?? 0) + 1;
    else
      sales[ym] = (sales[ym] ?? 0) + 1;
  });
  const sorted = Array.from(new Set([...Object.keys(sales), ...Object.keys(rents)])).sort().slice(-12);
  return {
    labels: sorted.map(ymLabel),
    datasets: [
      { label: 'Sales',   data: sorted.map(m => sales[m] ?? 0), backgroundColor: 'rgba(59,130,246,0.75)', borderRadius: 4 },
      { label: 'Rentals', data: sorted.map(m => rents[m] ?? 0), backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 4 },
    ],
  };
}

function bedroomMixChart(txs: DLDTransaction[]) {
  const counts: Record<string, number> = {};
  txs.forEach(t => {
    const r = (t.ROOMS_EN ?? '').toLowerCase();
    const key = r.includes('studio') ? 'Studio'
      : r.includes('1') ? '1 BR'
      : r.includes('2') ? '2 BR'
      : r.includes('3') ? '3 BR'
      : (r.includes('4') || r.includes('5') || r.includes('6')) ? '4+ BR'
      : null;
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  });
  const order = ['Studio', '1 BR', '2 BR', '3 BR', '4+ BR'];
  const labels = order.filter(l => counts[l]);
  return {
    labels,
    datasets: [{
      data: labels.map(l => counts[l]),
      backgroundColor: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899'],
      borderWidth: 0,
    }],
  };
}

function rentalByBedroomChart(rents: DLDRent[]) {
  const byBed: Record<string, number[]> = {};
  rents.forEach(r => {
    if (!r.CONTRACT_AMOUNT || r.CONTRACT_AMOUNT <= 0) return;
    const k = r.ROOMS_EN?.toLowerCase().includes('studio') ? 'Studio'
      : r.ROOMS_EN?.includes('1') ? '1 BR'
      : r.ROOMS_EN?.includes('2') ? '2 BR'
      : r.ROOMS_EN?.includes('3') ? '3 BR'
      : null;
    if (k) { if (!byBed[k]) byBed[k] = []; byBed[k].push(r.CONTRACT_AMOUNT); }
  });
  const order = ['Studio', '1 BR', '2 BR', '3 BR'];
  const labels = order.filter(l => byBed[l]?.length);
  const avg = (a: number[]) => Math.round(a.reduce((s, v) => s + v, 0) / a.length);
  return {
    labels,
    datasets: [
      { label: 'Min',    data: labels.map(l => Math.min(...byBed[l])), backgroundColor: 'rgba(59,130,246,0.35)', borderRadius: 4 },
      { label: 'Median', data: labels.map(l => avg(byBed[l])),         backgroundColor: 'rgba(59,130,246,0.85)', borderRadius: 4 },
      { label: 'Max',    data: labels.map(l => Math.max(...byBed[l])), backgroundColor: 'rgba(59,130,246,0.2)',  borderRadius: 4 },
    ],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (p: Plan) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 20% 50%,rgba(59,130,246,.08),transparent 50%),radial-gradient(ellipse at 80% 50%,rgba(16,185,129,.06),transparent 50%),#0d0f14' }}>
      <div className="flex rounded-2xl overflow-hidden border border-[#2a3040]" style={{ width: 860, maxWidth: '95vw', height: 560 }}>
        {/* left */}
        <div className="flex-1 p-10 flex flex-col justify-between border-r border-[#2a3040]"
          style={{ background: 'linear-gradient(135deg,rgba(59,130,246,.12),rgba(16,185,129,.06))' }}>
          <div>
            <div className="text-2xl font-extrabold text-[#3b82f6]">
              PropMap <span className="text-sm font-normal text-[#94a3b8] ml-1">Dubai Real Estate Intelligence</span>
            </div>
            <div className="mt-7 space-y-4">
              {[
                ['🏙️','55 Real Dubai Communities','Area markers sourced from DLD open-data registry'],
                ['📊','Live DLD Transaction Data','Every registered sale, rental & mortgage — real-time'],
                ['🗺️','Interactive Mapbox Map','3D buildings, area heatmap, click-to-drill community detail'],
                ['🔍','Filter by Area, Type & Transaction','Narrow to the area and transaction type you care about'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm"
                    style={{ background: 'rgba(59,130,246,.15)' }}>{icon}</div>
                  <div>
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="text-[11px] text-[#64748b] mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {[['Free','$0','10 txns/area',false],['Pro','$25','Full history + export',true],['Team','$75','5 seats + reports',false]].map(
              ([name,price,feat,pop]) => (
                <div key={name as string} className="flex-1 rounded-lg p-3 text-center border"
                  style={{ background:'#1e2330', borderColor: pop ? '#3b82f6' : '#2a3040' }}>
                  {pop && <div className="inline-block text-[9px] font-bold bg-[#3b82f6] text-white rounded px-1.5 mb-1">POPULAR</div>}
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[#64748b]">{name}</div>
                  <div className="text-xl font-extrabold">{price}<span className="text-[10px] font-normal text-[#64748b]">/mo</span></div>
                  <div className="text-[10px] text-[#64748b]">{feat}</div>
                </div>
              ))}
          </div>
        </div>
        {/* right */}
        <div className="w-[360px] p-10 flex flex-col justify-center" style={{ background:'#161a22' }}>
          <div className="text-xl font-bold">Welcome back</div>
          <div className="text-sm text-[#94a3b8] mt-1 mb-6">Sign in to PropMap</div>
          {[['Email','email','charan@abstractdxb.com'],['Password','password','••••••••']].map(([label,type,val]) => (
            <div key={label} className="mb-4">
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1.5">{label}</label>
              <input type={type} defaultValue={val}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none border"
                style={{ background:'#1e2330', borderColor:'#2a3040', color:'#e2e8f0' }} />
            </div>
          ))}
          <button onClick={() => onLogin('pro')}
            className="w-full py-3 rounded-lg font-bold text-sm text-white mb-3"
            style={{ background:'#3b82f6' }}>Sign In as Pro</button>
          <div className="relative text-center text-[11px] text-[#64748b] my-2">
            <span className="relative z-10 px-2 bg-[#161a22]">or</span>
            <div className="absolute inset-y-1/2 left-0 right-0 border-t border-[#2a3040]" />
          </div>
          <button onClick={() => onLogin('admin')}
            className="w-full py-2.5 rounded-lg border text-xs font-semibold"
            style={{ background:'transparent', borderColor:'#2a3040', color:'#10b981' }}>
            🔑 Continue as Admin (bypass paywall)
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap"
      style={{
        background:  active ? (color ?? '#3b82f6') : 'transparent',
        borderColor: active ? (color ?? '#3b82f6') : '#2a3040',
        color:       active ? '#fff' : '#94a3b8',
        boxShadow:   active ? `0 0 0 1px ${(color ?? '#3b82f6')}40` : 'none',
      }}>
      {label}
    </button>
  );
}

function NoTokenWarning() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="rounded-xl border px-6 py-5 max-w-sm text-center pointer-events-auto"
        style={{ background:'rgba(30,35,48,0.97)', borderColor:'#f59e0b', boxShadow:'0 0 0 1px rgba(245,158,11,0.2)' }}>
        <div className="text-2xl mb-2">🗺️</div>
        <div className="text-sm font-bold text-[#f59e0b] mb-1">Mapbox token not configured</div>
        <div className="text-[11px] text-[#94a3b8] leading-relaxed mb-3">
          Add your public Mapbox token to Vercel:<br />
          <strong className="text-[#e2e8f0]">Settings → Environment Variables</strong><br />
          <code className="text-[#10b981]">NEXT_PUBLIC_MAPBOX_TOKEN = pk.eyJ…</code>
        </div>
        <a href="https://account.mapbox.com" target="_blank" rel="noreferrer"
          className="inline-block text-xs font-semibold px-4 py-2 rounded-lg"
          style={{ background:'#f59e0b', color:'#0d0f14' }}>
          Get free token → mapbox.com
        </a>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div className="rounded-lg p-3 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
      <div className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">{label}</div>
      <div className="text-base font-bold text-[#3b82f6] leading-tight">{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: subColor ?? '#64748b' }}>{sub}</div>}
    </div>
  );
}

// ─── Map layer setup (called on initial load and after style change) ──────────

function setupLayers(map: mapboxgl.Map, geojson: AreaGeoJSON | null) {
  // 3D buildings from Mapbox tiles
  if (!map.getLayer('3d-buildings') && map.getStyle()?.name !== 'Streets') {
    try {
      map.addLayer({ id:'3d-buildings', source:'composite', 'source-layer':'building', filter:['==','extrude','true'], type:'fill-extrusion', minzoom:13, paint:{'fill-extrusion-color':'#1e2330','fill-extrusion-height':['get','height'],'fill-extrusion-base':['get','min_height'],'fill-extrusion-opacity':0.65} });
    } catch { /* layer already exists or source not available */ }
  }

  const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

  // Areas source
  if (!map.getSource('areas')) {
    map.addSource('areas', { type: 'geojson', data: (geojson as unknown as GeoJSON.FeatureCollection) ?? emptyFC });
    map.addLayer({
      id: 'area-points', type: 'circle', source: 'areas',
      paint: {
        'circle-color': ['case', ['get','hasDLD'], '#3b82f6', '#475569'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 5, 12, 8, 15, 12],
        'circle-stroke-width': 2,
        'circle-stroke-color': ['case', ['get','hasDLD'], 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.15)'],
        'circle-opacity': ['case', ['get','hasDLD'], 0.9, 0.45],
      },
    });
    map.addLayer({
      id: 'area-labels', type: 'symbol', source: 'areas',
      minzoom: 11,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-offset': [0, 1.3],
        'text-anchor': 'top',
        'text-max-width': 10,
      },
      paint: {
        'text-color': '#e2e8f0',
        'text-halo-color': 'rgba(13,15,20,0.9)',
        'text-halo-width': 1.5,
      },
    });
  }

  // Heatmap source
  if (!map.getSource('heatmap-data')) {
    map.addSource('heatmap-data', { type: 'geojson', data: emptyFC });
    map.addLayer({
      id: 'price-heatmap', type: 'heatmap', source: 'heatmap-data',
      layout: { visibility: 'none' },
      paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': 0.8,
        'heatmap-color': ['interpolate', 'linear', ['heatmap-density'],
          0, 'rgba(0,0,0,0)', 0.3, 'rgba(16,185,129,0.5)',
          0.6, 'rgba(245,158,11,0.7)', 1, 'rgba(239,68,68,0.9)'],
        'heatmap-radius': 55,
        'heatmap-opacity': 0.75,
      },
    });
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function MapApp() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  // Keep ref for stale-closure-safe access in callbacks
  const areasGeoJSONRef = useRef<AreaGeoJSON | null>(null);

  const [plan,          setPlan]          = useState<Plan | null>(null);
  const [mapReady,      setMapReady]      = useState(false);
  const [areasGeoJSON,  setAreasGeoJSON]  = useState<AreaGeoJSON | null>(null);
  const [areaNames,     setAreaNames]     = useState<string[]>([]);
  const [areasLoading,  setAreasLoading]  = useState(false);
  const [selectedArea,  setSelectedArea]  = useState<AreaFeature | null>(null);
  const [liveTx,        setLiveTx]        = useState<DLDTransaction[] | null>(null);
  const [liveRents,     setLiveRents]     = useState<DLDRent[] | null>(null);
  const [txLoading,     setTxLoading]     = useState(false);
  const [dataSource,    setDataSource]    = useState<'live' | 'none' | null>(null);
  const hasToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const [activeTab,     setActiveTab]     = useState<ActiveTab>('overview');
  const [mapStyle,      setMapStyle]      = useState<MapStyle>('dark');
  const [filters,       setFilters]       = useState<Filters>(EMPTY_FILTERS);
  const [heatmap,       setHeatmap]       = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [toast,         setToast]         = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }, []);

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
  }

  // ── Load area GeoJSON from API
  useEffect(() => {
    if (!plan) return;
    setAreasLoading(true);
    fetch('/api/map/areas')
      .then(r => r.json())
      .then((gj: AreaGeoJSON) => {
        areasGeoJSONRef.current = gj;
        setAreasGeoJSON(gj);
        setAreaNames(gj.features.map(f => f.properties.name).sort());
      })
      .catch(e => console.error('[PropMap] areas load failed', e))
      .finally(() => setAreasLoading(false));
  }, [plan]);

  // ── Init Mapbox
  useEffect(() => {
    if (!plan || !mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.dark,
      center: [55.2708, 25.2048],
      zoom: 11,
      pitch: 45,
      bearing: -10,
      antialias: true,
    });

    map.on('load', () => {
      setupLayers(map, areasGeoJSONRef.current);

      // Click → open area panel (map-level so it survives style changes)
      map.on('click', (e) => {
        if (!map.getLayer('area-points')) return;
        const features = map.queryRenderedFeatures(e.point, { layers: ['area-points'] });
        if (!features.length) return;
        const p = features[0].properties as {
          id: string; name: string;
          dldAreaId: string; dldAreaName: string; hasDLD: boolean;
        };
        const geo = features[0].geometry as GeoJSON.Point;
        setSelectedArea({
          id: p.id, name: p.name,
          dldAreaId: p.dldAreaId ?? '',
          dldAreaName: p.dldAreaName ?? '',
          lat: geo.coordinates[1],
          lng: geo.coordinates[0],
          hasDLD: Boolean(p.hasDLD),
        });
        setActiveTab('overview');
        map.flyTo({ center: [geo.coordinates[0], geo.coordinates[1]], zoom: Math.max(map.getZoom(), 13), pitch: 60, speed: 0.9 });
      });

      // Cursor on hover (map-level, survives style changes)
      map.on('mousemove', (e) => {
        if (!map.getLayer('area-points')) return;
        const features = map.queryRenderedFeatures(e.point, { layers: ['area-points'] });
        map.getCanvas().style.cursor = features.length ? 'pointer' : '';
      });

      setMapReady(true);
    });

    mapRef.current = map;
    showToast(plan === 'admin' ? '👋 Welcome, Admin — full access enabled' : '👋 Welcome back, Charan');
    return () => { map.remove(); mapRef.current = null; setMapReady(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  // ── Push area GeoJSON into map when both are ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !areasGeoJSON || !mapReady) return;

    const src = map.getSource('areas') as mapboxgl.GeoJSONSource | undefined;
    if (src) {
      src.setData(areasGeoJSON as unknown as GeoJSON.FeatureCollection);
    }
    // Heatmap: area centroid dots, equal weight
    const heatSrc = map.getSource('heatmap-data') as mapboxgl.GeoJSONSource | undefined;
    if (heatSrc) {
      heatSrc.setData({
        type: 'FeatureCollection',
        features: areasGeoJSON.features.map(f => ({
          type: 'Feature' as const,
          geometry: f.geometry,
          properties: { weight: 1 },
        })),
      });
    }
  }, [areasGeoJSON, mapReady]);

  // ── Apply area filter to map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer('area-points')) return;
    if (filters.areas.length === 0) {
      map.setFilter('area-points', null);
      map.setFilter('area-labels', null);
    } else {
      const f = ['in', ['get', 'name'], ['literal', filters.areas]] as mapboxgl.FilterSpecification;
      map.setFilter('area-points', f);
      map.setFilter('area-labels', f);
    }
  }, [filters.areas, mapReady]);

  // ── Fetch DLD data when area selected
  useEffect(() => {
    if (!selectedArea) return;

    setLiveTx(null);
    setLiveRents(null);
    setDataSource(null);

    if (!selectedArea.hasDLD || !selectedArea.dldAreaId) {
      setDataSource('none');
      setTxLoading(false);
      return;
    }

    setTxLoading(true);
    const to   = new Date();
    const from = new Date();
    from.setFullYear(from.getFullYear() - 2);
    const fmt  = (d: Date) =>
      `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

    const controller = new AbortController();
    const a = selectedArea;

    async function fetchData() {
      try {
        const txP   = new URLSearchParams({ from: fmt(from), to: fmt(to), areaId: a.dldAreaId, take: '50', skip: '0' });
        const rentP = new URLSearchParams({ from: fmt(from), to: fmt(to), areaId: a.dldAreaId, take: '30', skip: '0' });

        const [txRes, rentRes] = await Promise.all([
          fetch(`/api/dld/transactions?${txP}`, { signal: controller.signal }),
          fetch(`/api/dld/rents?${rentP}`,      { signal: controller.signal }),
        ]);

        if (txRes.ok) {
          const j = await txRes.json() as { data: { result: DLDTransaction[] } };
          const rows = j?.data?.result ?? [];
          setLiveTx(rows.length ? rows : null);
          setDataSource(rows.length ? 'live' : 'none');
        } else {
          setDataSource('none');
        }

        if (rentRes.ok) {
          const j = await rentRes.json() as { data: { result: DLDRent[] } };
          setLiveRents(j?.data?.result ?? []);
        }
      } catch (e: unknown) {
        if ((e as Error).name !== 'AbortError') {
          console.warn('[PropMap] DLD fetch error', e);
          setDataSource('none');
        }
      } finally {
        setTxLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [selectedArea]);

  // ── Map style change
  const changeStyle = (s: MapStyle) => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(MAP_STYLES[s]);
    setMapStyle(s);
    map.once('style.load', () => {
      setupLayers(map, areasGeoJSONRef.current);
      // Restore heatmap visibility if it was on
      if (heatmap && map.getLayer('price-heatmap')) {
        map.setLayoutProperty('price-heatmap', 'visibility', 'visible');
      }
      // Re-push GeoJSON data
      if (areasGeoJSONRef.current) {
        const src = map.getSource('areas') as mapboxgl.GeoJSONSource | undefined;
        src?.setData(areasGeoJSONRef.current as unknown as GeoJSON.FeatureCollection);
        const hSrc = map.getSource('heatmap-data') as mapboxgl.GeoJSONSource | undefined;
        hSrc?.setData({
          type: 'FeatureCollection',
          features: areasGeoJSONRef.current.features.map(f => ({
            type: 'Feature' as const, geometry: f.geometry, properties: { weight: 1 },
          })),
        });
      }
    });
  };

  const toggleHeatmap = () => {
    const map = mapRef.current;
    if (!map || !map.getLayer('price-heatmap')) return;
    const next = !heatmap;
    map.setLayoutProperty('price-heatmap', 'visibility', next ? 'visible' : 'none');
    setHeatmap(next);
  };

  const closePanel = () => {
    setSelectedArea(null);
    setLiveTx(null);
    setLiveRents(null);
    mapRef.current?.flyTo({ center:[55.2708,25.2048], zoom:11, pitch:45, speed:0.7 });
  };

  const isAdmin  = plan === 'admin';
  const showAll  = isAdmin || plan === 'pro';
  const txLimit  = showAll ? 50 : 10;

  // Computed chart data — only when we have live transactions
  const stats    = liveTx?.length ? computeStats(liveTx)        : null;
  const psfChart = liveTx?.length ? psfTrendChart(liveTx)       : null;
  const volChart = liveTx?.length ? volumeChart(liveTx)         : null;
  const bedChart = liveTx?.length ? bedroomMixChart(liveTx)     : null;
  const rentChart = liveRents?.length ? rentalByBedroomChart(liveRents) : null;

  // Filter transactions for display
  const displayTx = liveTx?.filter(t => {
    if (filters.txTypes.length) {
      const type = t.TRANSACTION_TYPE_EN?.toLowerCase() ?? '';
      const isRent = type.includes('rent');
      const isMort = type.includes('mort') || type.includes('financ');
      if (filters.txTypes.includes('Sales')     && !isRent && !isMort) return true;
      if (filters.txTypes.includes('Rentals')   && isRent)             return true;
      if (filters.txTypes.includes('Mortgages') && isMort)             return true;
      return false;
    }
    return true;
  }) ?? null;

  if (!plan) return <LoginScreen onLogin={setPlan} />;

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background:'#0d0f14' }}>
      <div ref={mapContainer} className="absolute inset-0" />
      {!hasToken && <NoTokenWarning />}

      {/* ── Header */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 border-b"
        style={{ height:56, background:'rgba(13,15,20,0.93)', backdropFilter:'blur(12px)', borderColor:'#2a3040' }}>
        <button onClick={() => setSidebarOpen(o=>!o)}
          className="w-8 h-8 rounded-md flex items-center justify-center border transition-colors flex-shrink-0"
          style={{ background:'#1e2330', borderColor:'#2a3040', color:'#94a3b8' }}>☰</button>
        <div className="text-lg font-bold text-[#3b82f6] whitespace-nowrap">
          PropMap <span className="text-sm font-normal text-[#94a3b8]">Dubai</span>
        </div>
        <div className="flex-1 max-w-sm relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">🔍</span>
          <input className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none border"
            style={{ background:'#1e2330', borderColor:'#2a3040', color:'#e2e8f0' }}
            placeholder="Search community or area…" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={toggleHeatmap}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{ background: heatmap?'rgba(239,68,68,.15)':'transparent', borderColor: heatmap?'#ef4444':'#2a3040', color: heatmap?'#ef4444':'#94a3b8' }}>
            🌡️ Heatmap
          </button>
          {areasLoading && (
            <span className="text-[11px] text-[#64748b] flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-t-transparent border-[#3b82f6] animate-spin" />
              Loading areas…
            </span>
          )}
          {!areasLoading && areaNames.length > 0 && (
            <span className="text-[11px] text-[#10b981]">✓ {areaNames.length} areas</span>
          )}
          {isAdmin && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background:'rgba(16,185,129,.15)', border:'1px solid rgba(16,185,129,.3)', color:'#10b981' }}>ADMIN</span>}
          {plan==='pro' && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border" style={{ borderColor:'#3b82f6',color:'#3b82f6' }}>PRO</span>}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
            style={{ background:'linear-gradient(135deg,#3b82f6,#10b981)' }}>C</div>
        </div>
      </header>

      {/* ── Left Sidebar */}
      <aside className="absolute z-30 overflow-y-auto border-r transition-transform duration-300"
        style={{ top:56, left:0, bottom:0, width:272, background:'rgba(13,15,20,0.93)', backdropFilter:'blur(12px)', borderColor:'#2a3040', transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>

        {/* Community filter */}
        <div className="p-4 border-b" style={{ borderColor:'#2a3040' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">Community / Area</span>
            {filters.areas.length > 0 &&
              <button onClick={() => setFilters(f=>({...f,areas:[]}))} className="text-[10px] text-[#3b82f6]">Clear</button>}
          </div>
          {areasLoading ? (
            <div className="text-[11px] text-[#64748b]">Loading…</div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {areaNames.map(a => (
                <Chip key={a} label={a} active={filters.areas.includes(a)}
                  onClick={() => setFilters(f=>({...f,areas:toggle(f.areas,a)}))} />
              ))}
            </div>
          )}
        </div>

        {/* Property Type */}
        <div className="p-4 border-b" style={{ borderColor:'#2a3040' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">Property Type</span>
            {filters.propTypes.length > 0 &&
              <button onClick={() => setFilters(f=>({...f,propTypes:[]}))} className="text-[10px] text-[#3b82f6]">Clear</button>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROP_TYPES.map(t => (
              <Chip key={t} label={t}
                active={filters.propTypes.includes(t)}
                onClick={() => setFilters(f=>({...f,propTypes:toggle(f.propTypes,t)}))} />
            ))}
          </div>
        </div>

        {/* Transaction Type */}
        <div className="p-4 border-b" style={{ borderColor:'#2a3040' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">Transaction</span>
            {filters.txTypes.length > 0 &&
              <button onClick={() => setFilters(f=>({...f,txTypes:[]}))} className="text-[10px] text-[#3b82f6]">Clear</button>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TX_TYPES.map(t => (
              <Chip key={t} label={t}
                color={t==='Sales'?'#3b82f6':t==='Rentals'?'#10b981':'#f59e0b'}
                active={filters.txTypes.includes(t)}
                onClick={() => setFilters(f=>({...f,txTypes:toggle(f.txTypes,t)}))} />
            ))}
          </div>
        </div>

        {/* Reset all */}
        {(filters.areas.length||filters.propTypes.length||filters.txTypes.length) ? (
          <div className="p-4">
            <button onClick={() => setFilters(EMPTY_FILTERS)}
              className="w-full py-2 rounded-lg border text-xs font-semibold text-[#ef4444] transition-colors"
              style={{ background:'rgba(239,68,68,0.06)', borderColor:'rgba(239,68,68,0.3)' }}>
              Reset All Filters
            </button>
          </div>
        ) : null}

        {/* DLD data indicator */}
        <div className="p-4 border-t" style={{ borderColor:'#2a3040' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-3">Data Sources</div>
          <div className="space-y-2">
            {[
              { dot:'#3b82f6', label:'DLD data available', sub:'Click area for live transactions' },
              { dot:'#475569', label:'Area mapped (no DLD match)', sub:'Coordinate data only' },
            ].map(({ dot, label, sub }) => (
              <div key={label} className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ background:dot }} />
                <div>
                  <div className="text-[11px] text-[#94a3b8]">{label}</div>
                  <div className="text-[10px] text-[#64748b]">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Developer legend */}
        <div className="p-4 border-t" style={{ borderColor:'#2a3040' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-3">Major Developers</div>
          <div className="space-y-1.5">
            {Object.entries(DEVELOPER_COLORS).filter(([d])=>d!=='Other').map(([dev,col])=>(
              <div key={dev} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:col }} />
                <span className="text-[11px] text-[#94a3b8]">{dev}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right Detail Panel */}
      <aside className="absolute top-14 right-0 bottom-0 overflow-y-auto z-30 border-l transition-transform duration-300"
        style={{ width:400, background:'rgba(13,15,20,0.96)', backdropFilter:'blur(16px)', borderColor:'#2a3040', transform: selectedArea ? 'translateX(0)' : 'translateX(100%)' }}>
        {selectedArea && (
          <>
            {/* Panel header */}
            <div className="sticky top-0 z-10 p-4 border-b flex items-start justify-between"
              style={{ background:'rgba(13,15,20,0.98)', backdropFilter:'blur(12px)', borderColor:'#2a3040' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: selectedArea.hasDLD ? '#10b981' : '#475569' }} />
                  <span className="text-[11px] font-semibold" style={{ color: selectedArea.hasDLD ? '#10b981' : '#64748b' }}>
                    {selectedArea.hasDLD ? '✓ DLD Live Data' : 'No DLD Match'}
                  </span>
                </div>
                <div className="text-base font-bold leading-tight">{selectedArea.name}</div>
                <div className="text-[11px] text-[#64748b] mt-1">Dubai · {selectedArea.dldAreaName}</div>
              </div>
              <button onClick={closePanel}
                className="w-7 h-7 rounded-md flex items-center justify-center text-xs border flex-shrink-0 ml-3"
                style={{ background:'#1e2330', borderColor:'#2a3040', color:'#94a3b8' }}>✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor:'#2a3040' }}>
              {(['overview','transactions','trends'] as ActiveTab[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2.5 text-[11px] font-semibold capitalize border-b-2 transition-colors"
                  style={{ borderColor: activeTab===tab ? '#3b82f6' : 'transparent', color: activeTab===tab ? '#3b82f6' : '#64748b' }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Overview */}
            {activeTab === 'overview' && (
              <div className="p-4 space-y-4">
                {txLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <span className="w-5 h-5 rounded-full border-2 border-t-transparent border-[#3b82f6] animate-spin" />
                    <span className="text-[12px] text-[#64748b]">Fetching DLD transactions…</span>
                  </div>
                ) : stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <StatCard label="Avg Sale PSF"       value={`AED ${stats.avgPsf.toLocaleString()}`}    sub="Per sq ft (sales)" />
                      <StatCard label="Avg Transaction"    value={`AED ${(stats.avgPrice/1e6).toFixed(2)}M`} sub="Sales only" />
                      <StatCard label="Total DLD Records"  value={stats.total.toLocaleString()}              sub="Last 2 years" />
                      <StatCard label="Most Recent"        value={stats.mostRecent}                          sub="Registered date" />
                    </div>
                    {psfChart && psfChart.labels.length > 1 && (
                      <div className="rounded-lg p-4 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                        <div className="text-xs font-semibold text-[#94a3b8] mb-3">Price / sqft — Monthly Avg (AED)</div>
                        <div style={{ height:160 }}>
                          <Line data={psfChart} options={{ ...CHART_OPTS, scales: { x: { ticks:{color:'#64748b',font:{size:10}}, grid:{color:'rgba(42,48,64,.5)'} }, y: { ticks:{color:'#64748b',font:{size:10},callback:(v)=>'AED '+Number(v).toLocaleString()}, grid:{color:'rgba(42,48,64,.5)'} } } }} />
                        </div>
                      </div>
                    )}
                    {volChart && volChart.labels.length > 0 && (
                      <div className="rounded-lg p-4 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                        <div className="text-xs font-semibold text-[#94a3b8] mb-3">Transaction Volume — Monthly</div>
                        <div style={{ height:140 }}>
                          <Bar data={volChart} options={{ ...CHART_OPTS, plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10},boxWidth:8,padding:8}}}, scales:{x:{stacked:true,ticks:{color:'#64748b',font:{size:10}},grid:{display:false}},y:{stacked:true,ticks:{color:'#64748b',font:{size:10}},grid:{color:'rgba(42,48,64,.5)'}}} }} />
                        </div>
                      </div>
                    )}
                    <div className="rounded-lg p-3 border text-center" style={{ background:'rgba(59,130,246,.05)', borderColor:'rgba(59,130,246,.2)', borderStyle:'dashed' }}>
                      <div className="text-[11px] text-[#64748b]">Showing 50 most recent transactions from DLD registry</div>
                    </div>
                  </>
                ) : dataSource === 'none' ? (
                  <div className="rounded-lg p-6 border text-center" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                    <div className="text-2xl mb-2">📭</div>
                    <div className="text-sm font-semibold mb-1">No DLD data available</div>
                    <div className="text-[11px] text-[#64748b]">This area hasn't been matched to a DLD area ID yet, or returned no transactions in the last 2 years.</div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Transactions */}
            {activeTab === 'transactions' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {txLoading ? (
                      <span className="text-[11px] text-[#64748b] flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-t-transparent border-[#3b82f6] animate-spin" />
                        Fetching DLD data…
                      </span>
                    ) : (
                      <>
                        <span className="text-[11px] text-[#64748b]">
                          {displayTx ? `${Math.min(displayTx.length, txLimit)} of ${liveTx?.[0]?.TOTAL ?? liveTx?.length ?? 0} records` : '—'}
                        </span>
                        {dataSource && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                            style={{ background: dataSource==='live' ? 'rgba(16,185,129,.15)' : 'rgba(100,116,139,.15)', color: dataSource==='live' ? '#10b981' : '#64748b' }}>
                            {dataSource === 'live' ? '✓ DLD Live' : '⚠ No Data'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {displayTx && displayTx.length > 0 ? (
                  <>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr style={{ borderBottom:'1px solid #2a3040' }}>
                          {['Date','Type','Beds','Size (sqm)','Amount (AED)'].map(h=>(
                            <th key={h} className="text-left py-2 px-1.5 text-[10px] font-bold uppercase tracking-wide text-[#64748b]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayTx.slice(0, txLimit).map((tx, i) => {
                          const blurred = !showAll && i >= 10;
                          const typeLow = tx.TRANSACTION_TYPE_EN?.toLowerCase() ?? '';
                          const type    = typeLow.includes('rent') ? 'rent' : typeLow.includes('mort') || typeLow.includes('financ') ? 'mortgage' : 'sale';
                          const typeColors: Record<string,{bg:string;text:string}> = {
                            sale:     { bg:'rgba(59,130,246,.15)',  text:'#3b82f6' },
                            rent:     { bg:'rgba(16,185,129,.15)',  text:'#10b981' },
                            mortgage: { bg:'rgba(245,158,11,.15)',  text:'#f59e0b' },
                          };
                          return (
                            <tr key={i} style={{ opacity:blurred?.3:1, filter:blurred?'blur(4px)':'none', userSelect:blurred?'none':'auto', borderBottom:'1px solid rgba(42,48,64,.4)' }}>
                              <td className="py-2 px-1.5 text-[11px] text-[#94a3b8]">{tx.INSTANCE_DATE?.split(' ')[0]}</td>
                              <td className="py-2 px-1.5">
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                                  style={{ background:typeColors[type].bg, color:typeColors[type].text }}>
                                  {tx.TRANSACTION_TYPE_EN?.slice(0,4) ?? type}
                                </span>
                              </td>
                              <td className="py-2 px-1.5 text-[11px]">{tx.ROOMS_EN ?? '—'}</td>
                              <td className="py-2 px-1.5 text-[11px] text-right">{tx.PROPERTY_SIZE_SQM ? Math.round(tx.PROPERTY_SIZE_SQM).toLocaleString() : '—'}</td>
                              <td className="py-2 px-1.5 text-[11px] font-semibold text-right">{tx.AMOUNT ? tx.AMOUNT.toLocaleString() : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!showAll && displayTx.length > 10 && (
                      <div className="mt-4 rounded-lg p-4 text-center border" style={{ background:'linear-gradient(135deg,rgba(59,130,246,.08),rgba(16,185,129,.06))', borderColor:'#3b82f6' }}>
                        <div className="text-sm font-bold mb-1">🔓 Unlock Full Transaction History</div>
                        <div className="text-[11px] text-[#94a3b8] mb-3">See all {liveTx?.[0]?.TOTAL ?? displayTx.length} DLD-verified transactions with buyer nationality, unit number & CSV export.</div>
                        <button onClick={() => showToast('Stripe checkout coming soon!')}
                          className="px-5 py-2 rounded-lg text-xs font-bold text-white" style={{ background:'#3b82f6' }}>
                          Upgrade to Pro — $25/mo
                        </button>
                      </div>
                    )}
                  </>
                ) : !txLoading ? (
                  <div className="rounded-lg p-6 border text-center" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                    <div className="text-2xl mb-2">📭</div>
                    <div className="text-sm text-[#64748b]">No transaction records found for this area.</div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Trends */}
            {activeTab === 'trends' && (
              <div className="p-4 space-y-4">
                {txLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <span className="w-5 h-5 rounded-full border-2 border-t-transparent border-[#3b82f6] animate-spin" />
                    <span className="text-[12px] text-[#64748b]">Loading DLD data…</span>
                  </div>
                ) : (
                  <>
                    {rentChart && rentChart.labels.length > 0 ? (
                      <div className="rounded-lg p-4 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                        <div className="text-xs font-semibold text-[#94a3b8] mb-3">Annual Rental by Bedroom (AED) — DLD Contracts</div>
                        <div style={{ height:180 }}>
                          <Bar data={rentChart} options={{ ...CHART_OPTS, plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10},boxWidth:8}}}, scales:{ x:{ticks:{color:'#64748b',font:{size:10}},grid:{display:false}}, y:{ticks:{color:'#64748b',font:{size:10},callback:(v)=>'AED '+(Number(v)/1000)+'K'},grid:{color:'rgba(42,48,64,.5)'}} } }} />
                        </div>
                      </div>
                    ) : liveRents !== null && (
                      <div className="rounded-lg p-4 border text-center" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                        <div className="text-[12px] text-[#64748b]">No rental contract data for this area.</div>
                      </div>
                    )}

                    {bedChart && bedChart.labels.length > 0 ? (
                      <div className="rounded-lg p-4 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                        <div className="text-xs font-semibold text-[#94a3b8] mb-3">Bedroom Mix — Transactions</div>
                        <div style={{ height:180 }}>
                          <Doughnut data={bedChart} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right',labels:{color:'#94a3b8',font:{size:10},boxWidth:10,padding:10}}} }} />
                        </div>
                      </div>
                    ) : liveTx !== null && (
                      <div className="rounded-lg p-4 border text-center" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                        <div className="text-[12px] text-[#64748b]">No bedroom breakdown available.</div>
                      </div>
                    )}

                    {!liveTx && !txLoading && (
                      <div className="rounded-lg p-6 border text-center" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                        <div className="text-2xl mb-2">📭</div>
                        <div className="text-sm text-[#64748b]">No DLD data available for trend analysis.</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </aside>

      {/* ── Map style buttons */}
      <div className="absolute bottom-6 z-30 flex gap-1.5 transition-all duration-300"
        style={{ left: sidebarOpen ? 284 : 16 }}>
        {(['dark','satellite','streets'] as MapStyle[]).map(s => (
          <button key={s} onClick={() => changeStyle(s)}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold border capitalize transition-all"
            style={{ background: mapStyle===s?'#3b82f6':'rgba(13,15,20,0.9)', backdropFilter:'blur(8px)', borderColor: mapStyle===s?'#3b82f6':'#2a3040', color: mapStyle===s?'#fff':'#94a3b8' }}>
            {s}
          </button>
        ))}
      </div>

      {/* ── Zoom controls */}
      <div className="absolute bottom-6 right-4 z-30 flex flex-col gap-1.5">
        {[{l:'+',a:()=>mapRef.current?.zoomIn()},{l:'−',a:()=>mapRef.current?.zoomOut()},{l:'⌖',a:()=>mapRef.current?.resetNorth()}].map(({l,a})=>(
          <button key={l} onClick={a}
            className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all"
            style={{ background:'rgba(13,15,20,0.9)', backdropFilter:'blur(8px)', borderColor:'#2a3040', color:'#94a3b8' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Legend */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-4 items-center rounded-full px-4 py-2 border"
        style={{ background:'rgba(13,15,20,0.9)', backdropFilter:'blur(8px)', borderColor:'#2a3040' }}>
        {[['#3b82f6','DLD data available'],['#475569','No DLD match'],['rgba(239,68,68,0.7)','Heatmap intensity']].map(([c,l])=>(
          <div key={l} className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
            <div className="w-2 h-2 rounded-full" style={{ background:c }} />{l}
          </div>
        ))}
      </div>

      {/* ── Toast */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-lg px-5 py-2.5 text-sm border pointer-events-none whitespace-nowrap transition-opacity duration-300"
        style={{ background:'#1e2330', borderColor:'#2a3040', opacity: toast?1:0 }}>
        {toast}
      </div>
    </div>
  );
}
