'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  BUILDINGS, COMMUNITIES, DEVELOPER_COLORS, devColor,
  buildingsToGeoJSON, generateTransactions,
  type Building, type Transaction,
} from '@/lib/data';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend);

// ─── Types ───────────────────────────────────────────────────────────────────
type Plan = 'free' | 'pro' | 'admin';
type MapStyle = 'dark' | 'satellite' | 'streets';
type ActiveTab = 'overview' | 'transactions' | 'trends';

interface Filters {
  developers: string[];
  propTypes:  string[];   // apartment | villa | townhouse | office | mixed
  txTypes:    string[];   // sale | rent | mortgage | mixed
  areas:      string[];
}

const EMPTY_FILTERS: Filters = { developers: [], propTypes: [], txTypes: [], areas: [] };

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

const DEVELOPERS = Object.keys(DEVELOPER_COLORS).filter(d => d !== 'Other');
const PROP_TYPES = ['apartment', 'villa', 'townhouse', 'office'];
const TX_TYPES   = ['sale', 'rent', 'mortgage'];
const AREAS      = Array.from(new Set(BUILDINGS.map(b => b.community))).sort();

// ─── Login ───────────────────────────────────────────────────────────────────
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
                ['🏙️','Building-level Transaction History','Every DLD-registered sale, rental & mortgage per building'],
                ['📊','Rental Index & Sales Trends','Quarterly benchmarks, PSF charts, yield by bedroom type'],
                ['🗺️','Interactive Mapbox Map','3D buildings, developer colour-coded markers, community layers'],
                ['🔍','Developer & Community Filters','Filter by Emaar, Meraas, Damac, Nakheel and more'],
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
            {[['Free','$0','10 txns/building',false],['Pro','$25','Full access + export',true],['Team','$75','5 seats + reports',false]].map(
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

// ─── Filter Chip ─────────────────────────────────────────────────────────────
function Chip({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap"
      style={{
        background:   active ? (color ?? '#3b82f6') : 'transparent',
        borderColor:  active ? (color ?? '#3b82f6') : '#2a3040',
        color:        active ? '#fff' : '#94a3b8',
        boxShadow:    active ? `0 0 0 1px ${color ?? '#3b82f6'}40` : 'none',
      }}>
      {label}
    </button>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function MapApp() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);

  const [plan,          setPlan]          = useState<Plan | null>(null);
  const [building,      setBuilding]      = useState<Building | null>(null);
  const [transactions,  setTransactions]  = useState<Transaction[]>([]);
  const [activeTab,     setActiveTab]     = useState<ActiveTab>('overview');
  const [mapStyle,      setMapStyle]      = useState<MapStyle>('dark');
  const [filters,       setFilters]       = useState<Filters>(EMPTY_FILTERS);
  const [heatmap,       setHeatmap]       = useState(false);
  const [showCompare,   setShowCompare]   = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [toast,         setToast]         = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }, []);

  // ── Toggle helpers
  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
  }

  // ── Init map
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
      // 3D buildings
      map.addLayer({
        id: '3d-buildings', source: 'composite', 'source-layer': 'building',
        filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 13,
        paint: {
          'fill-extrusion-color': '#1e2330',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.65,
        },
      });

      // ── Buildings GeoJSON source (clustered)
      map.addSource('buildings', {
        type: 'geojson',
        data: buildingsToGeoJSON(BUILDINGS),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 45,
      });

      // Cluster circle
      map.addLayer({
        id: 'clusters', type: 'circle', source: 'buildings',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#3b82f6', 5, '#f59e0b', 15, '#ef4444'],
          'circle-radius': ['step', ['get', 'point_count'], 18, 5, 26, 15, 34],
          'circle-opacity': 0.88,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.15)',
        },
      });

      // Cluster count label
      map.addLayer({
        id: 'cluster-count', type: 'symbol', source: 'buildings',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Individual building dots
      map.addLayer({
        id: 'building-points', type: 'circle', source: 'buildings',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 10, 16, 14],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.4)',
          'circle-opacity': 0.92,
        },
      });

      // Building name labels (show at zoom 15+)
      map.addLayer({
        id: 'building-labels', type: 'symbol', source: 'buildings',
        filter: ['!', ['has', 'point_count']],
        minzoom: 14,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-max-width': 10,
        },
        paint: {
          'text-color': '#e2e8f0',
          'text-halo-color': 'rgba(13,15,20,0.9)',
          'text-halo-width': 1.5,
        },
      });

      // Heatmap layer (price/sqft intensity)
      map.addSource('heatmap-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: BUILDINGS.map(b => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
            properties: { weight: b.avgPsf / 1000 },
          })),
        },
      });
      map.addLayer({
        id: 'price-heatmap', type: 'heatmap', source: 'heatmap-data',
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': 0.8,
          'heatmap-color': ['interpolate', 'linear', ['heatmap-density'],
            0, 'rgba(0,0,0,0)', 0.3, 'rgba(16,185,129,0.5)',
            0.6, 'rgba(245,158,11,0.7)', 1, 'rgba(239,68,68,0.9)'],
          'heatmap-radius': 55,
          'heatmap-opacity': 0.75,
        },
      });

      // ── Interactions
      // Zoom into cluster on click
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = (features[0].properties as { cluster_id: number }).cluster_id;
        (map.getSource('buildings') as mapboxgl.GeoJSONSource)
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || zoom === null) return;
            map.easeTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom });
          });
      });

      // Open building panel
      map.on('click', 'building-points', (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties as Building & { id: number };
        const b = BUILDINGS.find(x => x.id === props.id);
        if (b) {
          setBuilding(b);
          setActiveTab('overview');
          map.flyTo({ center: [b.lng, b.lat], zoom: Math.max(map.getZoom(), 15), pitch: 60, speed: 0.9 });
        }
      });

      map.on('mouseenter', 'clusters',        () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters',        () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'building-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'building-points', () => { map.getCanvas().style.cursor = ''; });
    });

    mapRef.current = map;
    showToast(plan === 'admin' ? '👋 Welcome, Admin — full access enabled' : '👋 Welcome back, Charan');

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  // ── Apply filters to map layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer('building-points')) return;

    const conditions: unknown[] = ['all', ['!', ['has', 'point_count']]];
    if (filters.developers.length)
      conditions.push(['in', ['get', 'developer'], ['literal', filters.developers]]);
    if (filters.propTypes.length)
      conditions.push(['in', ['get', 'propType'], ['literal', filters.propTypes]]);
    if (filters.txTypes.length)
      conditions.push(['in', ['get', 'txType'], ['literal', filters.txTypes]]);
    if (filters.areas.length)
      conditions.push(['in', ['get', 'community'], ['literal', filters.areas]]);

    map.setFilter('building-points', conditions as mapboxgl.FilterSpecification);
    map.setFilter('building-labels', conditions as mapboxgl.FilterSpecification);
  }, [filters]);

  // ── Generate transactions when building changes
  useEffect(() => {
    if (building) setTransactions(generateTransactions(building, building.totalTx));
  }, [building]);

  // ── Map style change
  const changeStyle = (s: MapStyle) => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(MAP_STYLES[s]);
    setMapStyle(s);
    map.once('style.load', () => {
      if (s !== 'streets') {
        map.addLayer({ id:'3d-buildings', source:'composite', 'source-layer':'building', filter:['==','extrude','true'], type:'fill-extrusion', minzoom:13, paint:{'fill-extrusion-color':'#1e2330','fill-extrusion-height':['get','height'],'fill-extrusion-base':['get','min_height'],'fill-extrusion-opacity':0.65} });
      }
    });
  };

  // ── Heatmap toggle
  const toggleHeatmap = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = !heatmap;
    map.setLayoutProperty('price-heatmap', 'visibility', next ? 'visible' : 'none');
    setHeatmap(next);
  };

  const closePanel = () => {
    setBuilding(null);
    mapRef.current?.flyTo({ center:[55.2708,25.2048], zoom:11, pitch:45, speed:0.7 });
  };

  const isAdmin = plan === 'admin';
  const showAll = isAdmin || plan === 'pro';
  const quarters = ['Q1 23','Q2 23','Q3 23','Q4 23','Q1 24','Q2 24','Q3 24','Q4 24','Q1 25'];

  const psfData = building ? {
    labels: quarters,
    datasets: [{ label:'AED/sqft',
      data: quarters.map((_,i) => Math.round(building.avgPsf * (0.82 + i * 0.024))),
      borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.12)', fill:true, tension:0.4, pointRadius:3 }],
  } : null;

  const volData = building ? {
    labels: quarters,
    datasets: [
      { label:'Sales',   data: quarters.map(()=>Math.round(10+Math.random()*25)), backgroundColor:'rgba(59,130,246,0.75)', borderRadius:4 },
      { label:'Rentals', data: quarters.map(()=>Math.round(5+Math.random()*15)),  backgroundColor:'rgba(16,185,129,0.75)', borderRadius:4 },
    ],
  } : null;

  const rentalBands: Record<string,number> = { Studio:45000,'1BR':80000,'2BR':130000,'3BR':180000,'Penthouse':350000 };
  const factor = building ? building.avgPsf / 1800 : 1;
  const rentalData = {
    labels: Object.keys(rentalBands),
    datasets: [
      { label:'Min',    data: Object.values(rentalBands).map(v=>Math.round(v*factor*0.85)), backgroundColor:'rgba(59,130,246,0.4)', borderRadius:4 },
      { label:'Median', data: Object.values(rentalBands).map(v=>Math.round(v*factor)),      backgroundColor:'rgba(59,130,246,0.85)', borderRadius:4 },
      { label:'Max',    data: Object.values(rentalBands).map(v=>Math.round(v*factor*1.25)), backgroundColor:'rgba(59,130,246,0.25)', borderRadius:4 },
    ],
  };

  const bedData = { labels:['Studio','1BR','2BR','3BR','4BR+'],
    datasets:[{ data:[18,32,28,15,7], backgroundColor:['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899'], borderWidth:0 }] };

  const txDisplay = showAll ? Math.min(transactions.length, 50) : 10;

  if (!plan) return <LoginScreen onLogin={setPlan} />;

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background:'#0d0f14' }}>
      <div ref={mapContainer} className="absolute inset-0" />

      {/* ── Header */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 border-b"
        style={{ height:56, background:'rgba(13,15,20,0.93)', backdropFilter:'blur(12px)', borderColor:'#2a3040' }}>
        <button onClick={() => setSidebarOpen(o=>!o)}
          className="w-8 h-8 rounded-md flex items-center justify-center border transition-colors flex-shrink-0"
          style={{ background:'#1e2330', borderColor:'#2a3040', color:'#94a3b8' }}>
          ☰
        </button>
        <div className="text-lg font-bold text-[#3b82f6] whitespace-nowrap">
          PropMap <span className="text-sm font-normal text-[#94a3b8]">Dubai</span>
        </div>
        <div className="flex-1 max-w-sm relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-xs">🔍</span>
          <input className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none border"
            style={{ background:'#1e2330', borderColor:'#2a3040', color:'#e2e8f0' }}
            placeholder="Search building, community or developer…" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setShowCompare(true)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border hidden sm:block"
            style={{ background:'transparent', borderColor:'#2a3040', color:'#94a3b8' }}>
            📊 Compare
          </button>
          <button onClick={toggleHeatmap}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{ background: heatmap?'rgba(239,68,68,.15)':'transparent', borderColor: heatmap?'#ef4444':'#2a3040', color: heatmap?'#ef4444':'#94a3b8' }}>
            🌡️ Heatmap
          </button>
          {isAdmin && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background:'rgba(16,185,129,.15)', border:'1px solid rgba(16,185,129,.3)', color:'#10b981' }}>ADMIN</span>}
          {plan==='pro' && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border" style={{ borderColor:'#3b82f6',color:'#3b82f6' }}>PRO</span>}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
            style={{ background:'linear-gradient(135deg,#3b82f6,#10b981)' }}>C</div>
        </div>
      </header>

      {/* ── Left Sidebar: Filters */}
      <aside className="absolute z-30 overflow-y-auto border-r transition-transform duration-300"
        style={{
          top:56, left:0, bottom:0, width:272,
          background:'rgba(13,15,20,0.93)', backdropFilter:'blur(12px)',
          borderColor:'#2a3040',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}>

        {/* Developer filter */}
        <div className="p-4 border-b" style={{ borderColor:'#2a3040' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">Developer</span>
            {filters.developers.length > 0 &&
              <button onClick={() => setFilters(f=>({...f,developers:[]}))} className="text-[10px] text-[#3b82f6]">Clear</button>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DEVELOPERS.map(dev => (
              <Chip key={dev} label={dev} color={devColor(dev)}
                active={filters.developers.includes(dev)}
                onClick={() => setFilters(f=>({...f,developers:toggle(f.developers,dev)}))} />
            ))}
          </div>
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
              <Chip key={t} label={t.charAt(0).toUpperCase()+t.slice(1)}
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
              <Chip key={t} label={t.charAt(0).toUpperCase()+t.slice(1)}
                color={t==='sale'?'#3b82f6':t==='rent'?'#10b981':'#f59e0b'}
                active={filters.txTypes.includes(t)}
                onClick={() => setFilters(f=>({...f,txTypes:toggle(f.txTypes,t)}))} />
            ))}
          </div>
        </div>

        {/* Community / Area */}
        <div className="p-4 border-b" style={{ borderColor:'#2a3040' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">Community</span>
            {filters.areas.length > 0 &&
              <button onClick={() => setFilters(f=>({...f,areas:[]}))} className="text-[10px] text-[#3b82f6]">Clear</button>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AREAS.map(a => (
              <Chip key={a} label={a} active={filters.areas.includes(a)}
                onClick={() => setFilters(f=>({...f,areas:toggle(f.areas,a)}))} />
            ))}
          </div>
        </div>

        {/* Reset all */}
        {(filters.developers.length||filters.propTypes.length||filters.txTypes.length||filters.areas.length) ? (
          <div className="p-4">
            <button onClick={() => setFilters(EMPTY_FILTERS)}
              className="w-full py-2 rounded-lg border text-xs font-semibold text-[#ef4444] transition-colors"
              style={{ background:'rgba(239,68,68,0.06)', borderColor:'rgba(239,68,68,0.3)' }}>
              Reset All Filters
            </button>
          </div>
        ) : null}

        {/* Market Stats */}
        <div className="p-4 border-t" style={{ borderColor:'#2a3040' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-3">Market Snapshot</div>
          {[
            ['Avg Sale PSF','AED 1,847','+12%',true],
            ['Total Transactions','93,215',null,null],
            ['Avg Rental Yield','6.8%','+0.4%',true],
            ['Off-Plan Share','62%',null,null],
          ].map(([label,value,badge,up]) => (
            <div key={label as string} className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderColor:'rgba(42,48,64,0.4)' }}>
              <span className="text-[11px] text-[#64748b]">{label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold">{value}</span>
                {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: up?'rgba(16,185,129,.15)':'rgba(239,68,68,.15)', color: up?'#10b981':'#ef4444' }}>
                  {badge}
                </span>}
              </div>
            </div>
          ))}
          <button onClick={() => setShowCompare(true)}
            className="w-full mt-3 py-2 rounded-lg border text-xs text-[#64748b] transition-colors"
            style={{ background:'transparent', borderColor:'#2a3040', borderStyle:'dashed' }}>
            + Compare Communities
          </button>
        </div>

        {/* Developer legend */}
        <div className="p-4 border-t" style={{ borderColor:'#2a3040' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-3">Developer Legend</div>
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
        style={{
          width:400, background:'rgba(13,15,20,0.96)', backdropFilter:'blur(16px)',
          borderColor:'#2a3040',
          transform: building ? 'translateX(0)' : 'translateX(100%)',
        }}>
        {building && (
          <>
            {/* Panel header */}
            <div className="sticky top-0 z-10 p-4 border-b flex items-start justify-between"
              style={{ background:'rgba(13,15,20,0.98)', backdropFilter:'blur(12px)', borderColor:'#2a3040' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: devColor(building.developer) }} />
                  <span className="text-[11px] font-semibold" style={{ color: devColor(building.developer) }}>
                    {building.developer}
                  </span>
                </div>
                <div className="text-base font-bold leading-tight">{building.name}</div>
                <div className="text-[11px] text-[#64748b] mt-1">
                  {building.community} · {building.floors} floors · {building.units.toLocaleString()} units · Est. {building.yearBuilt}
                </div>
              </div>
              <button onClick={closePanel}
                className="w-7 h-7 rounded-md flex items-center justify-center text-xs border flex-shrink-0 ml-3 transition-colors"
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
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label:'Avg Price/sqft',    value:`AED ${building.avgPsf.toLocaleString()}`, sub:'▲ +9% YoY', subColor:'#10b981' },
                    { label:'Last Registered Sale', value:`AED ${(building.lastSale/1e6).toFixed(1)}M`, sub:'This month', subColor:'#64748b' },
                    { label:'Total Units',        value:building.units.toLocaleString(), sub:`${building.floors} floors`, subColor:'#64748b' },
                    { label:'Transactions (2yr)', value:building.totalTx.toString(), sub:'DLD registered', subColor:'#64748b' },
                  ].map(c => (
                    <div key={c.label} className="rounded-lg p-3 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                      <div className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">{c.label}</div>
                      <div className="text-lg font-bold text-[#3b82f6]">{c.value}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: c.subColor }}>{c.sub}</div>
                    </div>
                  ))}
                </div>
                {psfData && (
                  <div className="rounded-lg p-4 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                    <div className="text-xs font-semibold text-[#94a3b8] mb-3">Price / sqft — 9 Quarters</div>
                    <div style={{ height:160 }}>
                      <Line data={psfData} options={{ ...CHART_OPTS, scales: { x: { ticks: { color:'#64748b', font:{size:10} }, grid:{color:'rgba(42,48,64,.5)'} }, y: { ticks:{color:'#64748b',font:{size:10},callback:(v)=>'AED '+v}, grid:{color:'rgba(42,48,64,.5)'} } } }} />
                    </div>
                  </div>
                )}
                {volData && (
                  <div className="rounded-lg p-4 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                    <div className="text-xs font-semibold text-[#94a3b8] mb-3">Transaction Volume</div>
                    <div style={{ height:140 }}>
                      <Bar data={volData} options={{ ...CHART_OPTS, plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10},boxWidth:8,padding:8}}}, scales:{ x:{stacked:true,ticks:{color:'#64748b',font:{size:10}},grid:{display:false}}, y:{stacked:true,ticks:{color:'#64748b',font:{size:10}},grid:{color:'rgba(42,48,64,.5)'}} } }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Transactions */}
            {activeTab === 'transactions' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] text-[#64748b]">Showing {txDisplay} of {building.totalTx}</span>
                  <select className="text-[11px] rounded-md px-2 py-1 border outline-none"
                    style={{ background:'#1e2330', borderColor:'#2a3040', color:'#e2e8f0' }}>
                    <option>All Types</option><option>Sales</option><option>Rentals</option><option>Mortgage</option>
                  </select>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom:'1px solid #2a3040' }}>
                      {['Date','Type','Beds','sqft','Price (AED)','PSF'].map(h=>(
                        <th key={h} className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-wide text-[#64748b] last:text-right">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, txDisplay).map((tx, i) => {
                      const blurred = !showAll && i >= 10;
                      const typeColors: Record<string,{bg:string;text:string}> = {
                        sale:     { bg:'rgba(59,130,246,.15)',  text:'#3b82f6' },
                        rent:     { bg:'rgba(16,185,129,.15)',  text:'#10b981' },
                        mortgage: { bg:'rgba(245,158,11,.15)',  text:'#f59e0b' },
                      };
                      return (
                        <tr key={i} style={{ opacity:blurred?.3:1, filter:blurred?'blur(4px)':'none', userSelect:blurred?'none':'auto', borderBottom:'1px solid rgba(42,48,64,.4)' }}>
                          <td className="py-2 px-2 text-[11px] text-[#94a3b8]">{tx.date}</td>
                          <td className="py-2 px-2">
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                              style={{ background:typeColors[tx.type].bg, color:typeColors[tx.type].text }}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-[11px]">{tx.bed}</td>
                          <td className="py-2 px-2 text-[11px] text-right">{tx.area.toLocaleString()}</td>
                          <td className="py-2 px-2 text-[11px] font-semibold text-right">{tx.price.toLocaleString()}</td>
                          <td className="py-2 px-2 text-[11px] text-[#64748b] text-right">{tx.psf ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!showAll && (
                  <div className="mt-4 rounded-lg p-4 text-center border" style={{ background:'linear-gradient(135deg,rgba(59,130,246,.08),rgba(16,185,129,.06))', borderColor:'#3b82f6' }}>
                    <div className="text-sm font-bold mb-1">🔓 Unlock Full Transaction History</div>
                    <div className="text-[11px] text-[#94a3b8] mb-3">Upgrade to Pro to see all {building.totalTx} transactions with buyer nationality, unit number & export.</div>
                    <button onClick={() => showToast('Stripe checkout coming soon!')}
                      className="px-5 py-2 rounded-lg text-xs font-bold text-white" style={{ background:'#3b82f6' }}>
                      Upgrade to Pro — $25/mo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Trends */}
            {activeTab === 'trends' && (
              <div className="p-4 space-y-4">
                <div className="rounded-lg p-4 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                  <div className="text-xs font-semibold text-[#94a3b8] mb-3">Annual Rental by Bedroom (AED)</div>
                  <div style={{ height:160 }}>
                    <Bar data={rentalData} options={{ ...CHART_OPTS, plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10},boxWidth:8}}}, scales:{ x:{ticks:{color:'#64748b',font:{size:10}},grid:{display:false}}, y:{ticks:{color:'#64748b',font:{size:10},callback:(v)=>'AED '+(Number(v)/1000)+'K'},grid:{color:'rgba(42,48,64,.5)'}} } }} />
                  </div>
                </div>
                <div className="rounded-lg p-4 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                  <div className="text-xs font-semibold text-[#94a3b8] mb-3">Bedroom Mix — Sales 2025</div>
                  <div style={{ height:160 }}>
                    <Doughnut data={bedData} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right',labels:{color:'#94a3b8',font:{size:10},boxWidth:10,padding:10}}} }} />
                  </div>
                </div>
                <div className="rounded-lg p-4 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[#64748b] mb-3">Rental Yield by Bedroom</div>
                  {[['Studio','8.1%',90],['1 Bed','6.8%',75],['2 Bed','6.2%',69],['3 Bed','5.4%',55],['Penthouse','4.8%',45]].map(([t,pct,w])=>(
                    <div key={t as string} className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] text-[#64748b] w-20">{t}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background:'#2a3040' }}>
                        <div className="h-1.5 rounded-full" style={{ width:`${w}%`, background:'#10b981' }} />
                      </div>
                      <span className="text-[11px] font-semibold w-9 text-right">{pct}</span>
                    </div>
                  ))}
                </div>
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

      {/* ── Zoom / pitch controls */}
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
        {[['#3b82f6','Sales dominant'],['#10b981','Rental dominant'],['#f59e0b','Mixed']].map(([c,l])=>(
          <div key={l} className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
            <div className="w-2 h-2 rounded-full" style={{ background:c }} />{l}
          </div>
        ))}
      </div>

      {/* ── Compare Modal */}
      {showCompare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background:'rgba(0,0,0,.72)', backdropFilter:'blur(4px)' }}
          onClick={e => e.target===e.currentTarget && setShowCompare(false)}>
          <div className="rounded-2xl p-6 border overflow-y-auto"
            style={{ background:'#161a22', borderColor:'#2a3040', width:740, maxWidth:'95vw', maxHeight:'85vh' }}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="text-lg font-bold">📊 Community Comparison</div>
                <div className="text-[11px] text-[#64748b] mt-0.5">Rental Index & PSF Benchmark — Q1 2025</div>
              </div>
              <button onClick={() => setShowCompare(false)}
                className="px-3 py-1 rounded-md text-xs border"
                style={{ background:'#1e2330', borderColor:'#2a3040', color:'#94a3b8' }}>✕ Close</button>
            </div>
            <div className="rounded-lg p-4 border mb-4" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
              <div className="text-xs font-semibold text-[#94a3b8] mb-3">Median Annual Rent by Bedroom (AED)</div>
              <div style={{ height:240 }}>
                <Bar
                  data={{ labels:['Studio','1BR','2BR','3BR'],
                    datasets:[
                      { label:'Downtown', data:[40000,75000,120000,180000], backgroundColor:'#3b82f6cc', borderRadius:4 },
                      { label:'Marina',   data:[55000,95000,145000,210000], backgroundColor:'#10b981cc', borderRadius:4 },
                      { label:'Palm',     data:[70000,130000,230000,380000],backgroundColor:'#f59e0bcc', borderRadius:4 },
                      { label:'Bus.Bay',  data:[35000,65000,100000,140000], backgroundColor:'#8b5cf6cc', borderRadius:4 },
                      { label:'JVC',      data:[28000,45000,70000,100000],  backgroundColor:'#f97316cc', borderRadius:4 },
                    ]}}
                  options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10},boxWidth:10}}}, scales:{x:{ticks:{color:'#64748b',font:{size:10}},grid:{display:false}},y:{ticks:{color:'#64748b',font:{size:10},callback:(v)=>'AED '+(Number(v)/1000)+'K'},grid:{color:'rgba(42,48,64,.5)'}}} }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {COMMUNITIES.slice(0,4).map(c => (
                <div key={c.name} className="rounded-lg p-3 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background:c.color }} />
                    <span className="text-sm font-bold">{c.name}</span>
                  </div>
                  <div className="text-[10px] text-[#64748b] mb-2">{c.developer}</div>
                  {[['Avg PSF',`AED ${c.psf.toLocaleString()}`],['Rental Yield',`${c.rentalYield}%`],['YoY Growth',`+${(Math.random()*12+3).toFixed(1)}%`]].map(([k,v])=>(
                    <div key={k} className="flex justify-between text-[11px] py-0.5">
                      <span className="text-[#64748b]">{k}</span><span className="font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="rounded-lg p-4 border" style={{ background:'#1e2330', borderColor:'#2a3040' }}>
              <div className="text-xs font-semibold text-[#94a3b8] mb-3">PSF Trend — Key Communities (AED)</div>
              <div style={{ height:180 }}>
                <Line
                  data={{ labels:['Q1 24','Q2 24','Q3 24','Q4 24','Q1 25','Q2 25'],
                    datasets:[
                      { label:'Downtown', data:[2200,2280,2320,2380,2420,2450], borderColor:'#3b82f6', backgroundColor:'transparent', tension:0.4, borderWidth:2, pointRadius:3 },
                      { label:'Marina',   data:[1700,1750,1800,1850,1890,1920], borderColor:'#10b981', backgroundColor:'transparent', tension:0.4, borderWidth:2, pointRadius:3 },
                      { label:'Palm',     data:[2800,2900,2980,3050,3120,3180], borderColor:'#f59e0b', backgroundColor:'transparent', tension:0.4, borderWidth:2, pointRadius:3 },
                      { label:'JVC',      data:[820,850,880,920,950,980],       borderColor:'#f97316', backgroundColor:'transparent', tension:0.4, borderWidth:2, pointRadius:3 },
                    ]}}
                  options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10},boxWidth:10}}}, scales:{x:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'rgba(42,48,64,.3)'}},y:{ticks:{color:'#64748b',font:{size:10},callback:(v)=>'AED '+v},grid:{color:'rgba(42,48,64,.3)'}}} }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-lg px-5 py-2.5 text-sm border pointer-events-none whitespace-nowrap transition-opacity duration-300"
        style={{ background:'#1e2330', borderColor:'#2a3040', opacity: toast?1:0 }}>
        {toast}
      </div>
    </div>
  );
}
