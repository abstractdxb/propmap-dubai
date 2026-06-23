import { NextResponse } from 'next/server';
import { getCached, setCached, TTL } from '@/lib/server/dld-cache';
import { DUBAI_COMMUNITIES } from '@/lib/server/dubai-areas';

export const runtime = 'nodejs';

const CACHE_KEY = 'map:areas:geojson:v4';

export async function GET() {
  const cached = getCached<object>(CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  const features = DUBAI_COMMUNITIES.map(comm => ({
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: [comm.lng, comm.lat] as [number, number],
    },
    properties: {
      id:      comm.id,
      name:    comm.name,
      bayutId: comm.bayutId,   // pre-resolved — no autocomplete call needed
    },
  }));

  const geojson = { type: 'FeatureCollection', features };
  setCached(CACHE_KEY, geojson, TTL.AREAS);
  return NextResponse.json(geojson);
}
