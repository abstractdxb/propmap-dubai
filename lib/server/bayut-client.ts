/**
 * Bayut / UAE Real Estate API client (RapidAPI: uae-real-estate3.p.rapidapi.com)
 *
 * Correct endpoints:
 *   GET /search-property  — active listings (not /transactions which doesn't exist)
 *   GET /autocomplete     — location search (not needed at runtime — IDs are hardcoded)
 *
 * Free tier: 900 req/month. All 55 Bayut location IDs are pre-resolved in
 * dubai-areas.ts so zero autocomplete calls are needed at runtime.
 * Each area click = 1 /search-property call, cached 24h.
 */

const BASE    = 'https://uae-real-estate3.p.rapidapi.com';
const API_KEY = process.env.RAPIDAPI_KEY ?? '';
const TIMEOUT = 12_000;

function timeoutSignal(ms: number): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

function rapidHeaders() {
  return {
    'x-rapidapi-key':  API_KEY,
    'x-rapidapi-host': 'uae-real-estate3.p.rapidapi.com',
  };
}

async function bayutGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs  = new URLSearchParams(params).toString();
  const url = `${BASE}${path}?${qs}`;
  const res = await fetch(url, { headers: rapidHeaders(), signal: timeoutSignal(TIMEOUT) });
  if (!res.ok) throw new Error(`BayutAPI ${path} → HTTP ${res.status}`);
  const json = await res.json() as { success: boolean; data: T };
  if (!json.success) throw new Error(`BayutAPI ${path} → success=false`);
  return json.data;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BayutProperty {
  id:               string;
  externalID:       string;
  title:            { en: string };
  purpose:          'for-sale' | 'for-rent';
  price:            number;
  rooms:            number;   // bedrooms
  baths:            number;
  area:             number;   // sqm
  category:         Array<{ name: string; slug: string; level: number }>;
  completionStatus: string | null;
  furnishingStatus: string | null;
  coverPhoto?:      { url: string };
  location:         Array<{ name?: { en: string }; level: number }>;
}

export interface BayutSearchData {
  properties:  BayutProperty[];
  total:       number;
  page:        number;
  totalPages:  number;
  hitsPerPage: number;
}

// ── Search properties ─────────────────────────────────────────────────────────

export async function bayutSearchProperty(params: {
  locationExternalId: string;
  purpose:            'for-sale' | 'for-rent';
  page?:              number;
  rooms?:             string;   // '1,2,3' etc
  priceMin?:          number;
  priceMax?:          number;
  categorySlug?:      string;   // 'apartments', 'villas', etc.
}): Promise<BayutSearchData> {
  const q: Record<string, string> = {
    location_external_id: params.locationExternalId,
    purpose:              params.purpose,
    page:                 String(params.page ?? 1),
    langs:                'en',
  };
  if (params.rooms)        q.rooms       = params.rooms;
  if (params.priceMin)     q.price_min   = String(params.priceMin);
  if (params.priceMax)     q.price_max   = String(params.priceMax);
  if (params.categorySlug) q.category    = params.categorySlug;

  return bayutGet<BayutSearchData>('/search-property', q);
}

// ── Normalised listing shape (used by MapApp) ─────────────────────────────────

export interface NormalisedListing {
  id:        string;
  title:     string;
  purpose:   'Sale' | 'Rent';
  price:     number;       // AED
  rooms:     number;       // bedrooms
  baths:     number;
  areaSqm:   number;
  areaSqft:  number;
  psfAED:    number;       // AED per sqft
  propType:  string;       // 'Apartments', 'Villas', etc.
  status:    string;       // 'Ready' | 'Off-Plan' | '—'
  furnished: string;       // 'Furnished' | 'Unfurnished' | '—'
  imageUrl:  string;
}

function propTypeLabel(category: BayutProperty['category']): string {
  const lvl1 = category?.find(c => c.level === 1);
  return lvl1?.name ?? 'Property';
}

function statusLabel(s: string | null): string {
  if (!s) return '—';
  if (s === 'ready')    return 'Ready';
  if (s === 'off_plan') return 'Off-Plan';
  return s;
}

function furnishedLabel(s: string | null): string {
  if (!s) return '—';
  if (s === 'furnished')      return 'Furnished';
  if (s === 'unfurnished')    return 'Unfurnished';
  if (s === 'part-furnished') return 'Part Furnished';
  return s;
}

export function normaliseBayutListing(p: BayutProperty): NormalisedListing {
  const areaSqm  = p.area ?? 0;
  const areaSqft = Math.round(areaSqm * 10.764);
  const psfAED   = areaSqft > 0 ? Math.round(p.price / areaSqft) : 0;
  return {
    id:        p.id,
    title:     p.title?.en ?? '',
    purpose:   p.purpose === 'for-sale' ? 'Sale' : 'Rent',
    price:     p.price ?? 0,
    rooms:     p.rooms ?? 0,
    baths:     p.baths ?? 0,
    areaSqm:   Math.round(areaSqm * 10) / 10,
    areaSqft,
    psfAED,
    propType:  propTypeLabel(p.category),
    status:    statusLabel(p.completionStatus),
    furnished: furnishedLabel(p.furnishingStatus),
    imageUrl:  p.coverPhoto?.url ?? '',
  };
}
