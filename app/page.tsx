import dynamic from 'next/dynamic';

// MapApp uses browser APIs (Mapbox, Chart.js) — must be client-only
const MapApp = dynamic(() => import('@/components/MapApp'), { ssr: false });

export default function Home() {
  return <MapApp />;
}
