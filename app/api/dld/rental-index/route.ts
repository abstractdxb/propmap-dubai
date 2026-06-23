import { NextRequest, NextResponse } from 'next/server';
import { dldRentalIndex } from '@/lib/server/dld-client';
import { getCached, setCached, cacheKey, TTL } from '@/lib/server/dld-cache';

export const runtime = 'nodejs';

/**
 * RERA Rental Index — official rent benchmarks by area + bedroom type.
 * Fetches from ext.dubailand.gov.ae/rentalindex (GET, no consumer-key needed).
 *
 * Query params:
 *   areaId   — DLD area ID
 *   propType — residential / commercial
 */
export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const areaId   = s.get('areaId')   ?? '';
  const propType = s.get('propType') ?? 'residential';

  const params: Record<string, string> = { areaId, propType };
  const key    = cacheKey('rental-index', params);
  const cached = getCached(key);
  if (cached) return NextResponse.json({ data: cached, source: 'cache' });

  try {
    // Fetch sub-areas list + rental values in parallel
    const [subAreas, rentalData] = await Promise.all([
      dldRentalIndex('GetResidentialSubAreas'),
      areaId
        ? dldRentalIndex('GetRentalIndexDetails', { areaId, propType })
        : Promise.resolve(null),
    ]);

    const data = { subAreas, rentalData };
    setCached(key, data, TTL.RENTAL_INDEX);
    return NextResponse.json({ data, source: 'live' });
  } catch (err) {
    console.error('[Rental Index]', err);
    return NextResponse.json(
      { error: 'Failed to fetch rental index', detail: String(err) },
      { status: 502 },
    );
  }
}
