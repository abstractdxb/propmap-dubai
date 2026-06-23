<<<<<<< HEAD
=======
/**
 * GET /api/map/areas
 *
 * Returns a GeoJSON FeatureCollection of Dubai communities.
 * Each feature's properties include `bayutQuery` (the community name to pass
 * to BayutAPI autocomplete) so the client can resolve externalIDs on demand.
 *
 * DLD carea-lookup is no longer called here — it was WAF-blocked from Vercel.
 * Bayut location IDs are resolved client-side (via /api/bayut/locate) on first
 * click and cached in sessionStorage.
 *
 * Cached for 7 days — the community list never changes.
 */

>>>>>>> 0c4618c (feat: replace DLD gateway with BayutAPI)
import { NextResponse } from 'next/server';
import { getCached, setCached, TTL } from '@/lib/server/dld-cache';
import { DUBAI_COMMUNITIES } from '@/lib/server/dubai-areas';

export const runtime = 'nodejs';

const CACHE_KEY = 'map:areas:geojson:v3';

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
      id:         comm.id,
      name:       comm.name,
<<<<<<< HEAD
      bayutQuery: comm.name,
=======
      bayutQuery: comm.name,   // used for autocomplete on first click
>>>>>>> 0c4618c (feat: replace DLD gateway with BayutAPI)
    },
  }));

  const geojson = { type: 'FeatureCollection', features };
  setCached(CACHE_KEY, geojson, TTL.AREAS);
  return NextResponse.json(geojson);
}
