import { NextResponse } from 'next/server';
import { dldPost, DLDArea, DLDResponse } from '@/lib/server/dld-client';
import { getCached, setCached, cacheKey, TTL } from '@/lib/server/dld-cache';

export const runtime = 'nodejs';

// Area list rarely changes — cache for 7 days
export async function GET() {
  const key    = cacheKey('areas', {});
  const cached = getCached<DLDResponse<DLDArea>>(key);
  if (cached) return NextResponse.json({ data: cached, source: 'cache' });

  try {
    const data = await dldPost<DLDResponse<DLDArea>>('carea-lookup', {});
    setCached(key, data, TTL.AREAS);
    return NextResponse.json({ data, source: 'live' });
  } catch (err) {
    console.error('[DLD areas]', err);
    return NextResponse.json(
      { error: 'Failed to fetch area list from DLD', detail: String(err) },
      { status: 502 },
    );
  }
}
