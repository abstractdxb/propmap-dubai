import { NextResponse } from 'next/server';
import { bayutSearchProperty } from '@/lib/server/bayut-client';

export const runtime = 'nodejs';

export async function GET() {
  const t0 = Date.now();
  let result: unknown = null;
  let error:  string | null = null;

  try {
    // Business Bay bayutId = 5093 — quick smoke test
    const data = await bayutSearchProperty({
      locationExternalId: '5093',
      purpose: 'for-sale',
      page: 1,
    });
    result = {
      total:      data.total,
      totalPages: data.totalPages,
      firstListing: data.properties[0]
        ? { price: data.properties[0].price, rooms: data.properties[0].rooms, area: data.properties[0].area }
        : null,
    };
  } catch (e) {
    error = String(e);
  }

  return NextResponse.json({
    status:    error ? 'error' : 'ok',
    latencyMs: Date.now() - t0,
    apiKeySet: Boolean(process.env.RAPIDAPI_KEY),
    test:      error ? { error } : { ok: true, result },
  });
}
