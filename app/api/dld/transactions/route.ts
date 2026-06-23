import { NextRequest, NextResponse } from 'next/server';
import { dldPost, DLDTransaction, DLDResponse } from '@/lib/server/dld-client';
import { getCached, setCached, cacheKey, TTL } from '@/lib/server/dld-cache';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;

  // Only include non-empty params — DLD gateway 500s on unexpected keys
  const params: Record<string, string> = {};
  const set = (k: string, v: string | null, def?: string) => {
    const val = v ?? def ?? '';
    if (val) params[k] = val;
  };

  set('P_FROM_DATE',    s.get('from'));
  set('P_TO_DATE',      s.get('to'));
  set('P_GROUP_ID',     s.get('type'));
  set('P_IS_OFFPLAN',   s.get('offplan'));
  set('P_IS_FREE_HOLD', s.get('freehold'));
  set('P_AREA_ID',      s.get('areaId'));
  set('P_USAGE_ID',     s.get('usage'));
  set('P_PROP_TYPE_ID', s.get('propType'));
  params['P_TAKE'] = s.get('take') ?? '25';
  params['P_SKIP'] = s.get('skip') ?? '0';

  const key    = cacheKey('transactions', params);
  const cached = getCached<DLDResponse<DLDTransaction>>(key);
  if (cached) {
    return NextResponse.json({ data: cached, source: 'cache' });
  }

  try {
    const data = await dldPost<DLDResponse<DLDTransaction>>('transactions', params);
    setCached(key, data, TTL.TRANSACTIONS);
    return NextResponse.json({ data, source: 'live' });
  } catch (err) {
    console.error('[DLD transactions]', err);
    return NextResponse.json(
      { error: 'Failed to fetch from DLD', detail: String(err) },
      { status: 502 },
    );
  }
}
