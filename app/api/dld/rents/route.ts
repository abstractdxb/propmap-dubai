import { NextRequest, NextResponse } from 'next/server';
import { dldPost, DLDRent, DLDResponse } from '@/lib/server/dld-client';
import { getCached, setCached, cacheKey, TTL } from '@/lib/server/dld-cache';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;

  const params: Record<string, string> = {
    P_FROM_DATE:    s.get('from')      ?? '',
    P_TO_DATE:      s.get('to')        ?? '',
    P_DATE_TYPE:    s.get('dateType')  ?? '',
    P_IS_FREE_HOLD: s.get('freehold')  ?? '',
    P_VERSION:      s.get('version')   ?? '',
    P_AREA_ID:      s.get('areaId')    ?? '',
    P_USAGE_ID:     s.get('usage')     ?? '',
    P_PROP_TYPE_ID: s.get('propType')  ?? '',
    P_TAKE:         s.get('take')      ?? '25',
    P_SKIP:         s.get('skip')      ?? '0',
    P_SORT:         s.get('sort')      ?? 'START_DATE_DESC',
  };

  const key    = cacheKey('rents', params);
  const cached = getCached<DLDResponse<DLDRent>>(key);
  if (cached) return NextResponse.json({ data: cached, source: 'cache' });

  try {
    const data = await dldPost<DLDResponse<DLDRent>>('rents', params);
    setCached(key, data, TTL.RENTS);
    return NextResponse.json({ data, source: 'live' });
  } catch (err) {
    console.error('[DLD rents]', err);
    return NextResponse.json(
      { error: 'Failed to fetch from DLD', detail: String(err) },
      { status: 502 },
    );
  }
}
