/**
 * GET /api/dld/health
 *
 * Tests BayutAPI connectivity. Check this after adding RAPIDAPI_KEY to Vercel.
 * Previously tested the DLD gateway — that is WAF-blocked from Vercel and abandoned.
 */

import { NextResponse } from 'next/server';
import { bayutTransactions, bayutAutocomplete } from '@/lib/server/bayut-client';

export const runtime = 'nodejs';

export async function GET() {
  const t0 = Date.now();

  // 1. Autocomplete test — resolve 'Dubai Marina' to an externalID
  let autocompleteResult: unknown = null;
  let autocompleteError:  string | null = null;
  try {
    const loc = await bayutAutocomplete('Dubai Marina');
    autocompleteResult = {
      name:       loc?.name?.en,
      externalID: loc?.externalID,
      type:       loc?.type,
      path:       loc?.path,
    };
  } catch (e) {
    autocompleteError = String(e);
  }

  // 2. Transactions test — fetch recent sales in Dubai Marina (externalID 5003)
  let txResult: unknown = null;
  let txError:  string | null = null;
  try {
    const data = await bayutTransactions({
      purpose:     'for-sale',
      locationIds: '5003',
      timePeriod:  '3m',
      page:        1,
    });
    txResult = {
      nbHits:   data.nbHits,
      nbPages:  data.nbPages,
      firstHit: data.hits[0] ?? null,
    };
  } catch (e) {
    txError = String(e);
  }

  const hasKey = Boolean(process.env.RAPIDAPI_KEY);
  const ok     = !autocompleteError && !txError;

  return NextResponse.json({
    status:   ok ? 'ok' : 'error',
    latencyMs: Date.now() - t0,
    apiKeySet: hasKey,
    autocomplete: autocompleteError
      ? { error: autocompleteError }
      : { ok: true, result: autocompleteResult },
    transactions: txError
      ? { error: txError }
      : { ok: true, result: txResult },
  });
}
