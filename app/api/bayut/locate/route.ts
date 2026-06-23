/**
 * GET /api/bayut/locate?query=Dubai+Marina
 *
 * Returns the Bayut externalID for a community name.
 * All 55 IDs are hardcoded in dubai-areas.ts — no API call needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { DUBAI_COMMUNITIES } from '@/lib/server/dubai-areas';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')?.trim().toLowerCase();
  if (!query) {
    return NextResponse.json({ error: 'query param required' }, { status: 400 });
  }

  const community = DUBAI_COMMUNITIES.find(
    c => c.name.toLowerCase() === query || c.id === query || c.dldName.toLowerCase() === query,
  );

  if (!community) {
    return NextResponse.json({ error: `No community found for: ${query}` }, { status: 404 });
  }

  return NextResponse.json({
    externalID: community.bayutId,
    name:       community.name,
    id:         community.id,
    source:     'hardcoded',
  });
}
