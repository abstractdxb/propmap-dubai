import { NextRequest, NextResponse } from 'next/server';
import { dldPost, DLDBuilding, DLDResponse } from '@/lib/server/dld-client';
import { getCached, setCached, cacheKey, TTL } from '@/lib/server/dld-cache';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;

  const params: Record<string, string> = {
    P_FROM_DATE:    s.get('from')      ?? '',
    P_TO_DATE:      s.get('to')        ?? '',
    P_IS_FREE_HOLD: s.get('freehold')  ?? '',
    P_AREA_ID:      s.get('areaId')    ?? '',
    P_ZONE_ID:      s.get('zoneId')    ?? '',
    P_IS_LEASE_HOLD:s.get('leasehold') ?? '',
    P_IS_OFFPLAN:   s.get('offplan')   ?? '',
    P_TAKE:         s.get('take')      ?? '50',
    P_SKIP:         s.get('skip')      ?? '0',
    P_SORT:         s.get('sort')      ?? 'BUILDING_NAME_EN_ASC',
  };

  const key    = cacheKey('buildings', params);
  const cached = getCached<DLDResponse<DLDBuilding>>(key);
  if (cached) return NextResponse.json({ data: cached, source: 'cache' });

  try {
    const data = await dldPost<DLDResponse<DLDBuilding>>('buildings', params);
    setCached(key, data, TTL.BUILDINGS);
    return NextResponse.json({ data, source: 'live' });
  } catch (err) {
    console.error('[DLD buildings]', err);
    return NextResponse.json(
      { error: 'Failed to fetch from DLD', detail: String(err) },
      { status: 502 },
    );
  }
}
