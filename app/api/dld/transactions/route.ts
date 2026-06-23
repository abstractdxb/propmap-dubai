/**
 * GET /api/dld/transactions
 *
 * Returns Bayut property listings for a Dubai community.
 * "transactions" is a legacy name kept for URL compatibility.
 *
 * Params:
 *   locationId  string   Bayut externalID (pre-resolved, hardcoded in dubai-areas.ts)
 *   purpose     string   'for-sale' | 'for-rent'  (default: 'for-sale')
 *   page        number   (default: 1)
 *   rooms       string   comma-separated bedroom counts
 *   priceMin    number
 *   priceMax    number
 *   category    string   'apartments' | 'villas' | etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { bayutSearchProperty, normaliseBayutListing, BayutSearchData } from '@/lib/server/bayut-client';
import { getCached, setCached, TTL } from '@/lib/server/dld-cache';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;

  const locationId = s.get('locationId');
  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
  }

  const purpose  = (s.get('purpose') ?? 'for-sale') as 'for-sale' | 'for-rent';
  const page     = Number(s.get('page') ?? '1');
  const rooms    = s.get('rooms')    ?? undefined;
  const priceMin = s.get('priceMin') ? Number(s.get('priceMin')) : undefined;
  const priceMax = s.get('priceMax') ? Number(s.get('priceMax')) : undefined;
  const category = s.get('category') ?? undefined;

  const cKey = `bayut:listings:${locationId}:${purpose}:${page}:${rooms ?? ''}:${priceMin ?? ''}:${priceMax ?? ''}:${category ?? ''}`;
  const cached = getCached<object>(cKey);
  if (cached) return NextResponse.json({ ...cached, source: 'cache' });

  try {
    const raw = await bayutSearchProperty({
      locationExternalId: locationId,
      purpose,
      page,
      rooms,
      priceMin,
      priceMax,
      categorySlug: category,
    });

    const listings = raw.properties.map(normaliseBayutListing);
    const body = {
      listings,
      total:      raw.total,
      page:       raw.page,
      totalPages: raw.totalPages,
      source:     'live',
    };
    // Cache 24h — listings don't change minute-to-minute
    setCached(cKey, body, TTL.TRANSACTIONS);
    return NextResponse.json(body);
  } catch (err) {
    console.error('[BayutAPI listings]', err);
    return NextResponse.json(
      { error: 'Failed to fetch listings', detail: String(err) },
      { status: 502 },
    );
  }
}
