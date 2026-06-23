/**
 * GET /api/map/areas
 *
 * Returns a GeoJSON FeatureCollection of Dubai communities enriched with
 * DLD area IDs.  Used by MapApp to render community dots on Mapbox and to
 * know which areaId to pass when fetching transactions.
 *
 * Cached for 7 days — area list never changes.
 */

import { NextResponse } from 'next/server';
import { dldPost, DLDArea, DLDResponse } from '@/lib/server/dld-client';
import { getCached, setCached, TTL } from '@/lib/server/dld-cache';
import { DUBAI_COMMUNITIES } from '@/lib/server/dubai-areas';

export const runtime = 'nodejs';

const CACHE_KEY = 'map:areas:geojson:v2';

function matchDLD(dldAreas: DLDArea[], dldName: string): DLDArea | undefined {
  const target = dldName.toUpperCase().trim();
  // 1. Exact match
  let found = dldAreas.find(a => a.AREA_EN?.toUpperCase().trim() === target);
  if (found) return found;
  // 2. Contains match (handles slight naming differences)
  found = dldAreas.find(a => {
    const an = a.AREA_EN?.toUpperCase().trim() ?? '';
    return an.includes(target) || target.includes(an);
  });
  return found;
}

export async function GET() {
  const cached = getCached<object>(CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  // Fetch DLD area list (already cached 7 days inside dld-cache)
  let dldAreas: DLDArea[] = [];
  try {
    const res = await dldPost<DLDResponse<DLDArea>>('carea-lookup', {});
    dldAreas = res?.result ?? [];
  } catch (e) {
    console.error('[MapAreas] DLD carea-lookup failed, returning coord-only GeoJSON', e);
  }

  // Build GeoJSON features
  const features = DUBAI_COMMUNITIES.map(comm => {
    const match = matchDLD(dldAreas, comm.dldName);
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [comm.lng, comm.lat] as [number, number],
      },
      properties: {
        id:          comm.id,
        name:        comm.name,
        dldAreaId:   match ? String(match.AREA_ID) : '',
        dldAreaName: match?.AREA_EN ?? comm.dldName,
        hasDLD:      Boolean(match),
      },
    };
  });

  const geojson = { type: 'FeatureCollection', features };
  setCached(CACHE_KEY, geojson, TTL.AREAS);
  return NextResponse.json(geojson);
}
