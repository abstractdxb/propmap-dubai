import { NextResponse } from 'next/server';
import { bayutTransactions, bayutAutocomplete } from '@/lib/server/bayut-client';

export const runtime = 'nodejs';

export async function GET() {
  const t0 = Date.now();

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

  const ok = !autocompleteError && !txError;

  return NextResponse.json({
    status:    ok ? 'ok' : 'error',
    latencyMs: Date.now() - t0,
    apiKeySet: Boolean(process.env.RAPIDAPI_KEY),
    autocomplete: autocompleteError ? { error: autocompleteError } : { ok: true, result: autocompleteResult },
    transactions: txError          ? { error: txError }           : { ok: true, result: txResult },
  });
}
