'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { COMMUNITIES, BUILDINGS, generateTransactions, type Building, type Transaction } from '@/lib/data';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

// ─── Types ───────────────────────────────────────────────────────────────────
type Plan = 'free' | 'pro' | 'admin';
type MapStyle = 'dark' | 'satellite' | 'streets';
type ActiveTab = 'overview' | 'transactions' | 'trends';

const MAP_STYLES: Record<MapStyle, string> = {
  dark:      'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  streets:   'mapbox://styles/mapbox/streets-v12',
};

const CHART_DEFAULTS = {
  color: '#e2e8f0',
  grid: 'rgba(42,48,64,0.5)',
  font: { family: "'Inter', sans-serif", size: 11 },
};

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (plan: Plan) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(16,185,129,0.06) 0%, transparent 50%), #0d0f14' }}>
      <div className="flex rounded-2xl overflow-hidden border border-[#2a3040]" style={{ width: 900, maxWidth: '95vw', height: 580 }}>

        {/* Left panel */}
        <div className="flex-1 p-10 flex flex-col justify-between border-r border-[#2a3040]"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.06))' }}>
          <div>
            <div className="text-2xl font-extrabold text-[#3b82f6]">PropMap
              <span className="block text-sm font-normal text-[#94a3b8] mt-1">Dubai Real Estate Intelligence</span>
            </div>
            <div className="mt-8 space-y-5">
              {[
                { icon: '🏙️', title: 'Building-level Transaction History', desc: 'Every sale, rental & mortgage registered with DLD' },
                { icon: '📊', title: 'Rental Index Comparison', desc: 'Compare rental benchmarks across communities side by side' },
                { icon: '🗺️', title: 'Interactive Mapbox Map', desc: '3D buildings, heatmaps, price overlays & community layers' },
                { icon: '🏘️', title: 'Developer & Community Filters', desc: 'Filter by Emaar, Damac, Nakheel and more' },
              ].map(f => (
                <div key={f.title} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.15)' }}>{f.icon}</div>
                  <div>
                    <div className="text-sm font-semibold">{f.title}</div>
                    <div className="text-xs text-[#64748b] mt-0.5">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {[
              { name: 'Free', price: '$0', feat: '10 txns/building', popular: false },
              { name: 'Pro', price: '$25', feat: 'Full access + charts', popular: true },
              { name: 'Team', price: '$75', feat: '5 seats + reports', popular: false },
            ].map(p => (
              <div key={p.name} className="flex-1 rounded-lg p-3 text-center border"
                style={{ background: '#1e2330', borderColor: p.popular ? '#3b82f6' : '#2a3040' }}>
                {p.popular && <div className="inline-block text-[9px] font-bold bg-[#3b82f6] text-white rounded px-1.5 mb-1">POPULAR</div>}
                <div className="text-[10px] font-bold uppercase tracking-wide text-[#64748b]">{p.name}</div>
                <div className="text-xl font-extrabold mt-0.5">{p.price}<span className="text-[11px] font-normal text-[#64748b]">/mo</span></div>
                <div className="text-[10px] text-[#64748b]">{p.feat}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-[380px] p-10 flex flex-col justify-center" style={{ background: '#161a22' }}>
          <div className="text-xl font-bold">Welcome back</div>
          <div className="text-sm text-[#94a3b8] mt-1 mb-7">Sign in to your PropMap account</div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1.5">Email</label>
              <input className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none border"
                style={{ background: '#1e2330', borderColor: '#2a3040', color: '#e2e8f0' }}
                defaultValue="charan@abstractdxb.com" type="email" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1.5">Password</label>
              <input className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none border"
                style={{ background: '#1e2330', borderColor: '#2a3040', color: '#e2e8f0' }}
                defaultValue="••••••••" type="password" />
            </div>
          </div>
          <button onClick={() => onLogin('pro')}
            className="w-full mt-5 py-3 rounded-lg font-bold text-sm text-white transition-colors"
            style={{ background: '#3b82f6' }}
            onMouseOver={e => (e.currentTarget.style.background = '#2563eb')}
            onMouseOut={e => (e.currentTarget.style.background = '#3b82f6')}>
            Sign In as Pro User
          </button>
          <div className="relative text-center text-[11px] text-[#64748b] my-3">
            <span className="relative z-10 px-2" style={{ background: '#161a22' }}>or</span>
            <div className="absolute inset-y-1/2 left-0 right-0 border-t border-[#2a3040]" />
          </div>
          <button onClick={() => onLogin('admin')}
            className="w-full py-2.5 rounded-lg border text-xs font-semibold transition-colors"
            style={{ background: 'transparent', borderColor: '#2a3040', color: '#10b981' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.borderColor = '#10b981'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#2a3040'; }}>
            🔑 Continue as Admin (bypass payment)
          </button>
          <div className="text-center text-[11px] text-[#64748b] mt-4">
            Don&apos;t have an account? <span className="text-[#3b82f6] cursor-pointer">Sign up free</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: string }) {
  return (
    <div className="rounded-lg p-3 border" style={{ background: '#1e2330', borderColor: '#2a3040' }}>
      <div className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">{label}</div>
      <div className="text-lg font-bold text-[#3b82f6]">{value}</div>
      {sub && <div className="text-[10px] text-[#64748b] mt-0.5">{sub}</div>}
      {trend && <div className="text-[11px] font-semibold mt-1 text-[#10b981]">{trend}</div>}
    </div>
  );
}

// ─── Transaction Row ─────────────────────────────────────────────────────────
function TxRow({ tx, blurred }: { tx: Transaction; blurred: boolean }) {
  const typeColors: Record<string, string> = {
    sale: 'rgba(59,130,246,0.15)',
    rent: 'rgba(16,185,129,0.15)',
    mortgage: 'rgba(245,158,11,0.15)',
  };
  const typeText: Record<string, string> = { sale: '#3b82f6', rent: '#10b981', mortgage: '#f59e0b' };

  return (
    <tr style={{ opacity: blurred ? 0.4 : 1, filter: blurred ? 'blur(3px)' : 'none', userSelect: blurred ? 'none' : 'auto' }}>
      <td className="py-2.5 px-3 text-xs text-[#94a3b8] whitespace-nowrap">{tx.date}</td>
      <td className="py-2.5 px-3">
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
          style={{ background: typeColors[tx.type], color: typeText[tx.type] }}>
          {tx.type}
        </span>
      </td>
      <td className="py-2.5 px-3 text-xs">{tx.bed}</td>
      <td className="py-2.5 px-3 text-xs text-right">{tx.area.toLocaleString()}</td>
      <td className="py-2.5 px-3 text-xs text-right font-semibold">{tx.price.toLocaleString()}</td>
      <td className="py-2.5 px-3 text-xs text-right text-[#94a3b8]">{tx.psf ?? '—'}</td>
    </tr>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function MapApp() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [toast, setToast] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }, []);

  // Init map after login
  useEffect(() => {
    if (!plan || !mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.dark,
      center: [55.2708, 25.2048],
      zoom: 11.5,
      pitch: 45,
      bearing: -15,
      antialias: true,
    });

    map.on('load', () => {
      // 3D buildings
      map.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': '#1e2330',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.7,
        },
      });

      // Community labels
      COMMUNITIES.forEach(c => {
        const el = document.createElement('div');
        el.innerHTML = `<div style="background:rgba(13,15,20,0.75);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:3px 8px;font-size:10px;font-weight:600;color:#94a3b8;white-space:nowrap;pointer-events:none">${c.name}</div>`;
        new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([c.lng, c.lat]).addTo(map);
      });

      // Building markers
      BUILDINGS.forEach(b => {
        const colors = { sale: '#3b82f6', rent: '#10b981', mixed: '#f59e0b' };
        const el = document.createElement('div');
        el.style.cssText = `width:12px;height:12px;border-radius:50%;background:${colors[b.type]};border:2px solid rgba(255,255,255,0.4);cursor:pointer;transition:transform 0.15s,box-shadow 0.15s`;
        el.title = b.name;
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.6)'; el.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.2)'; });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; el.style.boxShadow = ''; });
        el.addEventListener('click', () => {
          setActiveBuilding(b);
          setActiveTab('overview');
          map.flyTo({ center: [b.lng, b.lat], zoom: 16, pitch: 60, speed: 0.8 });
        });
        new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([b.lng, b.lat]).addTo(map);
      });

      // Heatmap source
      map.addSource('price-heat', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: BUILDINGS.map(b => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
            properties: { intensity: b.avgPsf / 1000 },
          })),
        },
      });
      map.addLayer({
        id: 'price-heatmap',
        type: 'heatmap',
        source: 'price-heat',
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': ['get', 'intensity'],
          'heatmap-intensity': 0.8,
          'heatmap-color': ['interpolate', 'linear', ['heatmap-density'],
            0, 'rgba(0,0,0,0)', 0.3, 'rgba(16,185,129,0.5)', 0.6, 'rgba(245,158,11,0.7)', 1, 'rgba(239,68,68,0.9)'],
          'heatmap-radius': 60,
          'heatmap-opacity': 0.75,
        },
      });
    });

    mapRef.current = map;
    showToast(plan === 'admin' ? '👋 Welcome, Admin — full access enabled' : '👋 Welcome back, Charan');
  }, [plan, showToast]);

  // Handle transactions when building changes
  useEffect(() => {
    if (activeBuilding) {
      setTransactions(generateTransactions(activeBuilding, activeBuilding.totalTx));
    }
  }, [activeBuilding]);

  const toggleHeatmap = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = !heatmapOn;
    map.setLayoutProperty('price-heatmap', 'visibility', next ? 'visible' : 'none');
    setHeatmapOn(next);
  };

  const changeStyle = (style: MapStyle) => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(MAP_STYLES[style]);
    setMapStyle(style);
    map.once('style.load', () => {
      if (style !== 'streets') {
        map.addLayer({ id: '3d-buildings', source: 'composite', 'source-layer': 'building', filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 13, paint: { 'fill-extrusion-color': '#1e2330', 'fill-extrusion-height': ['get', 'height'], 'fill-extrusion-base': ['get', 'min_height'], 'fill-extrusion-opacity': 0.7 } });
      }
    });
  };

  const flyTo = (lat: number, lng: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, pitch: 55, speed: 0.9 });
  };

  const closePanel = () => {
    setActiveBuilding(null);
    mapRef.current?.flyTo({ center: [55.2708, 25.2048], zoom: 11.5, pitch: 45, speed: 0.6 });
  };

  // ── Chart data helpers
  const quarters = ['Q1 23', 'Q2 23', 'Q3 23', 'Q4 23', 'Q1 24', 'Q2 24', 'Q3 24', 'Q4 24', 'Q1 25'];

  const psfChartData = activeBuilding ? {
    labels: quarters,
    datasets: [{
      label: 'AED/sqft',
      data: quarters.map((_, i) => Math.round(activeBuilding.avgPsf * (0.82 + i * 0.025))),
      borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 3,
    }],
  } : null;

  const volChartData = activeBuilding ? {
    labels: quarters,
    datasets: [
      { label: 'Sales', data: quarters.map(() => Math.round(15 + Math.random() * 25)), backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 4 },
      { label: 'Rentals', data: quarters.map(() => Math.round(8 + Math.random() * 15)), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
    ],
  } : null;

  const rentalBands = { Studio: 45000, '1BR': 80000, '2BR': 130000, '3BR': 180000, Penthouse: 350000 };
  const factor = activeBuilding ? activeBuilding.avgPsf / 1800 : 1;
  const rentalChartData = {
    labels: Object.keys(rentalBands),
    datasets: [
      { label: 'Min', data: Object.values(rentalBands).map(v => Math.round(v * factor * 0.85)), backgroundColor: 'rgba(59,130,246,0.4)', borderRadius: 4 },
      { label: 'Median', data: Object.values(rentalBands).map(v => Math.round(v * factor)), backgroundColor: 'rgba(59,130,246,0.8)', borderRadius: 4 },
      { label: 'Max', data: Object.values(rentalBands).map(v => Math.round(v * factor * 1.25)), backgroundColor: 'rgba(59,130,246,0.3)', borderRadius: 4 },
    ],
  };

  const bedroomChartData = {
    labels: ['Studio', '1BR', '2BR', '3BR', '4BR+'],
    datasets: [{ data: [18, 32, 28, 15, 7], backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'], borderWidth: 0 }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#64748b', font: CHART_DEFAULTS.font }, grid: { color: CHART_DEFAULTS.grid } },
      y: { ticks: { color: '#64748b', font: CHART_DEFAULTS.font }, grid: { color: CHART_DEFAULTS.grid } },
    },
  };

  const showCount = plan === 'free' ? 10 : Math.min(transactions.length, 40);
  const isAdmin = plan === 'admin';

  if (!plan) return <LoginScreen onLogin={setPlan} />;

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#0d0f14' }}>

      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center gap-4 px-4 border-b"
        style={{ height: 56, background: 'rgba(13,15,20,0.92)', backdropFilter: 'blur(12px)', borderColor: '#2a3040' }}>
        <div className="text-lg font-bold text-[#3b82f6] whitespace-nowrap">
          PropMap <span className="text-sm font-normal text-[#94a3b8]">Dubai</span>
        </div>
        <div className="flex-1 max-w-sm relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-sm">🔍</span>
          <input className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none border"
            style={{ background: '#1e2330', borderColor: '#2a3040', color: '#e2e8f0' }}
            placeholder="Search building, community or developer…" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setShowCompare(true)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            style={{ background: 'transparent', borderColor: '#2a3040', color: '#94a3b8' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#2a3040'; e.currentTarget.style.color = '#94a3b8'; }}>
            📊 Compare Areas
          </button>
          <button onClick={toggleHeatmap}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            style={{ background: heatmapOn ? 'rgba(239,68,68,0.15)' : 'transparent', borderColor: heatmapOn ? '#ef4444' : '#2a3040', color: heatmapOn ? '#ef4444' : '#94a3b8' }}>
            🌡️ Heatmap
          </button>
          {isAdmin && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>ADMIN</span>}
          {plan === 'pro' && <span className="text-xs font-bold px-2.5 py-1 rounded-full border" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>PRO</span>}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #10b981)' }}
            onClick={() => showToast('Profile menu coming soon')}>C</div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="absolute top-14 left-0 bottom-0 overflow-y-auto z-30 border-r"
        style={{ width: 280, background: 'rgba(13,15,20,0.92)', backdropFilter: 'blur(12px)', borderColor: '#2a3040' }}>

        {/* Filters */}
        <div className="p-4 border-b" style={{ borderColor: '#2a3040' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-3">Filters</div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Developer</label>
              <select className="w-full rounded-md px-2.5 py-2 text-xs outline-none border"
                style={{ background: '#1e2330', borderColor: '#2a3040', color: '#e2e8f0' }}>
                <option>All Developers</option>
                {['Emaar', 'Damac', 'Nakheel', 'Meraas', 'Sobha', 'Aldar'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Transaction Type</label>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Sales', 'Rentals', 'Mortgage'].map((t, i) => (
                  <button key={t} className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors"
                    style={{ background: i === 0 ? '#3b82f6' : 'transparent', borderColor: i === 0 ? '#3b82f6' : '#2a3040', color: i === 0 ? '#fff' : '#94a3b8' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1.5">Year</label>
              <select className="w-full rounded-md px-2.5 py-2 text-xs outline-none border"
                style={{ background: '#1e2330', borderColor: '#2a3040', color: '#e2e8f0' }}>
                <option>2024 – 2025</option>
                <option>2023 – 2024</option>
                <option>All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Market Snapshot */}
        <div className="p-4 border-b" style={{ borderColor: '#2a3040' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-3">Market Snapshot</div>
          {[
            { label: 'Avg Sale Price/sqft', value: 'AED 1,847', badge: '+12%', up: true },
            { label: 'Total Transactions', value: '93,215', badge: null, up: null },
            { label: 'Avg Rental Yield', value: '6.8%', badge: '+0.4%', up: true },
            { label: 'Off-Plan Share', value: '62%', badge: null, up: null },
          ].map(s => (
            <div key={s.label} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: 'rgba(42,48,64,0.5)' }}>
              <span className="text-[11px] text-[#64748b]">{s.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold">{s.value}</span>
                {s.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: s.up ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: s.up ? '#10b981' : '#ef4444' }}>
                  {s.badge}
                </span>}
              </div>
            </div>
          ))}
        </div>

        {/* Top Communities */}
        <div className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-3">Top Communities</div>
          {COMMUNITIES.slice(0, 6).map(c => (
            <div key={c.name} className="flex justify-between items-center py-2 border-b last:border-0 cursor-pointer"
              style={{ borderColor: 'rgba(42,48,64,0.5)' }}
              onClick={() => flyTo(c.lat, c.lng)}>
              <span className="text-[11px] text-[#64748b] hover:text-[#94a3b8]">{c.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold">AED {c.psf.toLocaleString()}/sqft</span>
              </div>
            </div>
          ))}
          <button onClick={() => setShowCompare(true)}
            className="w-full mt-3 py-2.5 rounded-lg border text-xs text-[#64748b] transition-colors"
            style={{ background: 'transparent', borderColor: '#2a3040', borderStyle: 'dashed' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#2a3040'; e.currentTarget.style.color = '#64748b'; }}>
            + Compare Communities
          </button>
        </div>
      </aside>

      {/* Detail Panel */}
      <aside className="absolute top-14 right-0 bottom-0 overflow-y-auto z-30 border-l transition-transform duration-300"
        style={{ width: 400, background: 'rgba(13,15,20,0.95)', backdropFilter: 'blur(16px)', borderColor: '#2a3040', transform: activeBuilding ? 'translateX(0)' : 'translateX(100%)' }}>
        {activeBuilding && (
          <>
            <div className="sticky top-0 z-10 flex items-start justify-between p-4 border-b"
              style={{ background: 'rgba(13,15,20,0.98)', backdropFilter: 'blur(12px)', borderColor: '#2a3040' }}>
              <div>
                <div className="text-base font-bold leading-tight">{activeBuilding.name}</div>
                <div className="text-xs text-[#64748b] mt-1">{activeBuilding.community} · {activeBuilding.developer} · {activeBuilding.floors} Floors · Est. {activeBuilding.yearBuilt}</div>
              </div>
              <button onClick={closePanel}
                className="w-7 h-7 rounded-md flex items-center justify-center text-sm border flex-shrink-0 ml-3 transition-colors"
                style={{ background: '#1e2330', borderColor: '#2a3040', color: '#94a3b8' }}
                onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#1e2330'; e.currentTarget.style.color = '#94a3b8'; }}>✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: '#2a3040' }}>
              {(['overview', 'transactions', 'trends'] as ActiveTab[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2.5 text-xs font-semibold capitalize border-b-2 transition-colors"
                  style={{ borderColor: activeTab === tab ? '#3b82f6' : 'transparent', color: activeTab === tab ? '#3b82f6' : '#64748b' }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <StatCard label="Avg Price/sqft" value={`AED ${activeBuilding.avgPsf.toLocaleString()}`} trend="▲ +9% YoY" />
                  <StatCard label="Last Sale" value={`AED ${(activeBuilding.lastSale / 1000000).toFixed(1)}M`} sub="Registered this month" />
                  <StatCard label="Total Units" value={activeBuilding.units.toLocaleString()} sub={`${activeBuilding.floors} floors`} />
                  <StatCard label="Transactions (2yrs)" value={activeBuilding.totalTx.toString()} sub="Avg 1 every 3 days" />
                </div>
                {psfChartData && (
                  <div className="rounded-lg p-4 border" style={{ background: '#1e2330', borderColor: '#2a3040' }}>
                    <div className="text-xs font-semibold text-[#94a3b8] mb-3">Price per sqft — Last 9 Quarters</div>
                    <div style={{ height: 170 }}><Line data={psfChartData} options={chartOptions} /></div>
                  </div>
                )}
                {volChartData && (
                  <div className="rounded-lg p-4 border" style={{ background: '#1e2330', borderColor: '#2a3040' }}>
                    <div className="text-xs font-semibold text-[#94a3b8] mb-3">Transaction Volume</div>
                    <div style={{ height: 170 }}>
                      <Bar data={volChartData} options={{ ...chartOptions, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: CHART_DEFAULTS.font, boxWidth: 10 } } }, scales: { x: { stacked: true, ticks: { color: '#64748b', font: CHART_DEFAULTS.font }, grid: { display: false } }, y: { stacked: true, ticks: { color: '#64748b', font: CHART_DEFAULTS.font }, grid: { color: CHART_DEFAULTS.grid } } } }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transactions */}
            {activeTab === 'transactions' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#64748b]">Showing {showCount} of {activeBuilding.totalTx} transactions</span>
                  <select className="text-[11px] rounded-md px-2 py-1 border outline-none"
                    style={{ background: '#1e2330', borderColor: '#2a3040', color: '#e2e8f0' }}>
                    <option>All Types</option><option>Sales</option><option>Rentals</option><option>Mortgages</option>
                  </select>
                </div>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2a3040' }}>
                      {['Date', 'Type', 'Beds', 'sqft', 'Price (AED)', '/sqft'].map(h => (
                        <th key={h} className="py-2 px-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-[#64748b] first:pl-3 last:text-right">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, isAdmin ? 40 : 15).map((tx, i) => (
                      <TxRow key={i} tx={tx} blurred={!isAdmin && plan === 'free' && i >= 10} />
                    ))}
                  </tbody>
                </table>
                {plan === 'free' && (
                  <div className="mt-4 rounded-lg p-4 text-center border" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.06))', borderColor: '#3b82f6' }}>
                    <div className="text-sm font-bold mb-1">🔓 Unlock Full Transaction History</div>
                    <div className="text-xs text-[#94a3b8] mb-3">Upgrade to Pro to see all {activeBuilding.totalTx} transactions with dates, buyer info, and export.</div>
                    <button onClick={() => showToast('Stripe checkout coming soon!')}
                      className="px-5 py-2 rounded-lg text-xs font-bold text-white"
                      style={{ background: '#3b82f6' }}>
                      Upgrade to Pro — $25/mo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Trends */}
            {activeTab === 'trends' && (
              <div className="p-4 space-y-4">
                <div className="rounded-lg p-4 border" style={{ background: '#1e2330', borderColor: '#2a3040' }}>
                  <div className="text-xs font-semibold text-[#94a3b8] mb-3">Annual Rental Rates (AED/yr)</div>
                  <div style={{ height: 170 }}>
                    <Bar data={rentalChartData} options={{ ...chartOptions, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: CHART_DEFAULTS.font, boxWidth: 10 } } }, scales: { x: { ticks: { color: '#64748b', font: CHART_DEFAULTS.font }, grid: { display: false } }, y: { ticks: { color: '#64748b', font: CHART_DEFAULTS.font, callback: (v: unknown) => 'AED ' + Number(v).toLocaleString() }, grid: { color: CHART_DEFAULTS.grid } } } }} />
                  </div>
                </div>
                <div className="rounded-lg p-4 border" style={{ background: '#1e2330', borderColor: '#2a3040' }}>
                  <div className="text-xs font-semibold text-[#94a3b8] mb-3">Bedroom Mix — Sales 2025</div>
                  <div style={{ height: 170 }}>
                    <Doughnut data={bedroomChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: CHART_DEFAULTS.font, boxWidth: 10, padding: 12 } } } }} />
                  </div>
                </div>
                <div className="rounded-lg p-4 border space-y-2" style={{ background: '#1e2330', borderColor: '#2a3040' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[#64748b] mb-3">Rental Yield by Unit Type</div>
                  {[['Studio', '8.1%', 90], ['1 Bedroom', '6.8%', 75], ['2 Bedroom', '6.2%', 69], ['3 Bedroom', '5.4%', 55], ['Penthouse', '4.8%', 45]].map(([type, pct, w]) => (
                    <div key={type as string} className="flex items-center justify-between">
                      <span className="text-[11px] text-[#64748b] w-24">{type}</span>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="h-1.5 rounded-full flex-1" style={{ background: '#2a3040' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${w}%`, background: '#10b981' }} />
                        </div>
                        <span className="text-[12px] font-semibold w-10 text-right">{pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </aside>

      {/* Style toggle */}
      <div className="absolute bottom-6 z-30 flex gap-1.5" style={{ left: 296 }}>
        {(['dark', 'satellite', 'streets'] as MapStyle[]).map(s => (
          <button key={s} onClick={() => changeStyle(s)}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold border capitalize transition-colors"
            style={{ background: mapStyle === s ? '#3b82f6' : 'rgba(13,15,20,0.9)', backdropFilter: 'blur(8px)', borderColor: mapStyle === s ? '#3b82f6' : '#2a3040', color: mapStyle === s ? '#fff' : '#94a3b8' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Map controls */}
      <div className="absolute bottom-6 right-4 z-30 flex flex-col gap-1.5">
        {[
          { label: '+', action: () => mapRef.current?.zoomIn() },
          { label: '−', action: () => mapRef.current?.zoomOut() },
          { label: '⌖', action: () => mapRef.current?.resetNorth() },
        ].map(({ label, action }) => (
          <button key={label} onClick={action}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base border transition-colors"
            style={{ background: 'rgba(13,15,20,0.9)', backdropFilter: 'blur(8px)', borderColor: '#2a3040', color: '#94a3b8' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#2a3040'; e.currentTarget.style.color = '#94a3b8'; }}>
            {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-4 items-center rounded-full px-4 py-2 border"
        style={{ background: 'rgba(13,15,20,0.9)', backdropFilter: 'blur(8px)', borderColor: '#2a3040' }}>
        {[['#3b82f6', 'Sales'], ['#10b981', 'Rentals'], ['#f59e0b', 'Mixed']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />{label}
          </div>
        ))}
      </div>

      {/* Compare Modal */}
      {showCompare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowCompare(false)}>
          <div className="rounded-2xl p-6 border overflow-y-auto" style={{ background: '#161a22', borderColor: '#2a3040', width: 760, maxWidth: '95vw', maxHeight: '85vh' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-lg font-bold">📊 Community Comparison</div>
                <div className="text-xs text-[#64748b] mt-0.5">Rental Index & Sales Price Benchmark — Q4 2025</div>
              </div>
              <button onClick={() => setShowCompare(false)}
                className="px-3 py-1 rounded-md text-xs border transition-colors"
                style={{ background: '#1e2330', borderColor: '#2a3040', color: '#94a3b8' }}>✕ Close</button>
            </div>

            <div className="rounded-lg p-4 border mb-4" style={{ background: '#1e2330', borderColor: '#2a3040' }}>
              <div className="text-xs font-semibold text-[#94a3b8] mb-3">Median Rental by Bedroom Type (AED/year)</div>
              <div style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: ['Studio', '1BR', '2BR', '3BR'],
                    datasets: [
                      { label: 'Downtown', data: [40000, 75000, 120000, 180000], backgroundColor: '#3b82f6cc', borderRadius: 4 },
                      { label: 'Marina', data: [55000, 95000, 145000, 210000], backgroundColor: '#10b981cc', borderRadius: 4 },
                      { label: 'Palm', data: [70000, 130000, 230000, 380000], backgroundColor: '#f59e0bcc', borderRadius: 4 },
                      { label: 'Business Bay', data: [35000, 65000, 100000, 140000], backgroundColor: '#8b5cf6cc', borderRadius: 4 },
                      { label: 'JVC', data: [28000, 45000, 70000, 100000], backgroundColor: '#f97316cc', borderRadius: 4 },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: CHART_DEFAULTS.font, boxWidth: 10 } } }, scales: { x: { ticks: { color: '#64748b', font: CHART_DEFAULTS.font }, grid: { display: false } }, y: { ticks: { color: '#64748b', font: CHART_DEFAULTS.font, callback: (v: unknown) => 'AED ' + (Number(v) / 1000) + 'K' }, grid: { color: CHART_DEFAULTS.grid } } } }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {COMMUNITIES.slice(0, 4).map(c => (
                <div key={c.name} className="rounded-lg p-3 border" style={{ background: '#1e2330', borderColor: '#2a3040' }}>
                  <div className="text-sm font-bold">{c.name}</div>
                  <div className="text-[10px] text-[#64748b] mb-2">{c.developer}</div>
                  {[['Avg Price/sqft', `AED ${c.psf.toLocaleString()}`], ['Rental Yield', `${c.rentalYield}%`], ['YoY Growth', `+${(Math.random() * 12 + 3).toFixed(1)}%`]].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs py-1">
                      <span className="text-[#64748b]">{k}</span>
                      <span className="font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="rounded-lg p-4 border" style={{ background: '#1e2330', borderColor: '#2a3040' }}>
              <div className="text-xs font-semibold text-[#94a3b8] mb-3">Price/sqft Trend — All Communities</div>
              <div style={{ height: 200 }}>
                <Line
                  data={{
                    labels: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24', 'Q1 25', 'Q2 25'],
                    datasets: [
                      { label: 'Downtown', data: [2200, 2280, 2320, 2380, 2420, 2450], borderColor: '#3b82f6', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2, pointRadius: 3 },
                      { label: 'Marina', data: [1700, 1750, 1800, 1850, 1890, 1920], borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2, pointRadius: 3 },
                      { label: 'Palm', data: [2800, 2900, 2980, 3050, 3120, 3180], borderColor: '#f59e0b', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2, pointRadius: 3 },
                      { label: 'JVC', data: [820, 850, 880, 920, 950, 980], borderColor: '#f97316', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2, pointRadius: 3 },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: CHART_DEFAULTS.font, boxWidth: 10 } } }, scales: { x: { ticks: { color: '#64748b', font: CHART_DEFAULTS.font }, grid: { color: 'rgba(42,48,64,0.3)' } }, y: { ticks: { color: '#64748b', font: CHART_DEFAULTS.font, callback: (v: unknown) => 'AED ' + v }, grid: { color: 'rgba(42,48,64,0.3)' } } } }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-lg px-5 py-2.5 text-sm border pointer-events-none transition-opacity duration-300 whitespace-nowrap"
        style={{ background: '#1e2330', borderColor: '#2a3040', opacity: toast ? 1 : 0 }}>
        {toast}
      </div>

    </div>
  );
}
