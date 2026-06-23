/**
 * GET /api/bayut/locate?query=Dubai+Marina
 *
 * Resolves a community name to a Bayut externalID (used as location_ids in
 * the /transactions endpoint).  Cached permanently in the in-memory store
 * so each community is only looked up once per cold start.
 */

import { NextRequest, NextResponse } from 'next/server';
import { bayutAutocomplete } from '@/lib/server/bayut-client';
import { getCached, setCached } from '@/lib/server/dld-cache';

export const runtime = 'nodejs';

const TTL_FOREVER = 30 * 24 * 60 * 60 * 1000; // 30 days — IDs don't change

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')?.trim();
  if (!query) {
    return NextResponse.json({ error: 'query param required' }, { status: 400 });
  }

  const key    = `bayut:locate:${query.toLowerCase()}`;
  const cached = getCached<{ externalID: string; name: string; path: string }>(key);
  if (cached) return NextResponse.json({ ...cached, source: 'cache' });

  try {
    const loc = await bayutAutocomplete(query);
    if (!loc) {
      return NextResponse.json({ error: `No Bayut location found for: ${query}` }, { status: 404 });
    }
    const result = {
      externalID: loc.externalID,
      name:       loc.name.en,
      path:       loc.path,
    };
    setCached(key, result, TTL_FOREVER);
    return NextResponse.json({ ...result, source: 'live' });
  } catch (err) {
    console.error('[bayut/locate]', err);
    return NextResponse.json(
      { error: 'BayutAPI autocomplete failed', detail: String(err) },
      { status: 502 },
    );
  }
}
