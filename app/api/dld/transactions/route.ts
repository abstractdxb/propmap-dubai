/**
 * GET /api/dld/transactions
 *
 * Proxies to BayutAPI (RapidAPI) instead of the DLD gateway, which is WAF-blocked
 * for all Vercel server-side IPs.
 *
 * Query params accepted:
 *   purpose      'for-sale' | 'for-rent'  (default: 'for-sale')
 *   locationIds  comma-separated Bayut externalIDs  (e.g. '5003')
 *   timePeriod   '1m' | '3m' | '6m' | '12m' | '24m'  (default: '12m')
 *   category     'apartments' | 'villas' | 'townhouses' | 'commercial' | ...
 *   status       'completed' | 'under-construction' | 'any'
 *   beds         comma-separated bedroom counts (0 = studio)
 *   priceMin     number
 *   priceMax     number
 *   sortBy       'date_desc' | 'date_asc' | 'price_desc' | 'price_asc'
 *   page         number  (default: 1)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  bayutTransactions,
  normaliseBayutTx,
  BayutTransactionsParams,
} from '@/lib/server/bayut-client';
import { getCached, setCached, cacheKey, TTL } from '@/lib/server/dld-cache';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;

  const purpose = (s.get('purpose') ?? 'for-sale') as 'for-sale' | 'for-rent';
  const page    = Number(s.get('page') ?? '1');

  const params: BayutTransactionsParams = {
    purpose,
    page,
    locationIds:      s.get('locationIds')  ?? undefined,
    timePeriod:       (s.get('timePeriod')  as BayutTransactionsParams['timePeriod']) ?? '12m',
    categoryIds:      s.get('category')     ?? undefined,
    completionStatus: (s.get('status')      as BayutTransactionsParams['completionStatus']) ?? undefined,
    beds:             s.get('beds')         ?? undefined,
    priceMin:         s.get('priceMin')     ? Number(s.get('priceMin'))  : undefined,
    priceMax:         s.get('priceMax')     ? Number(s.get('priceMax'))  : undefined,
    sortBy:           (s.get('sortBy')      as BayutTransactionsParams['sortBy'])      ?? 'date_desc',
  };

  const key    = cacheKey('bayut:transactions', params as unknown as Record<string, string>);
  const cached = getCached<object>(key);
  if (cached) {
    return NextResponse.json({ ...cached, source: 'cache' });
  }

  try {
    const raw  = await bayutTransactions(params);
    const hits = raw.hits.map(normaliseBayutTx);
    const body = {
      transactions: hits,
      total:        raw.nbHits,
      page:         raw.page,
      totalPages:   raw.nbPages,
      source:       'live',
    };
    setCached(key, body, TTL.TRANSACTIONS);
    return NextResponse.json(body);
  } catch (err) {
    console.error('[BayutAPI transactions]', err);
    return NextResponse.json(
      { error: 'Failed to fetch from BayutAPI', detail: String(err) },
      { status: 502 },
    );
  }
}
