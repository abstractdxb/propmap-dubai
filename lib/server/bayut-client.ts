/**
 * BayutAPI client — serves DLD-registered transaction data via RapidAPI.
 *
 * Endpoint base: https://uae-real-estate3.p.rapidapi.com
 * Auth: x-rapidapi-key header (set RAPIDAPI_KEY in Vercel env vars)
 *
 * Free tier: 900 requests/month. Responses are cached aggressively to minimise usage.
 */

const BASE    = 'https://uae-real-estate3.p.rapidapi.com';
const API_KEY = process.env.RAPIDAPI_KEY ?? '';
const TIMEOUT = 12_000;

function timeoutSignal(ms: number): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

function headers() {
  return {
    'x-rapidapi-key':  API_KEY,
    'x-rapidapi-host': 'uae-real-estate3.p.rapidapi.com',
  };
}

async function bayutGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs  = new URLSearchParams(params).toString();
  const url = `${BASE}${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, { headers: headers(), signal: timeoutSignal(TIMEOUT) });
  if (!res.ok) throw new Error(`BayutAPI ${path} → HTTP ${res.status}`);
  const json = await res.json() as { success: boolean; data: T };
  if (!json.success) throw new Error(`BayutAPI ${path} → success=false`);
  return json.data;
}

// ── Location autocomplete → resolve community name to externalID ──────────────

export interface BayutLocation {
  id:         number;
  externalID: string;
  name:       { en: string };
  type:       string;
  level:      number;
  path:       string;
  geography:  { lat: number; lng: number };
}

interface AutocompleteData {
  locations: BayutLocation[];
  total:     number;
}

export async function bayutAutocomplete(query: string): Promise<BayutLocation | null> {
  const data = await bayutGet<AutocompleteData>('/autocomplete', { query, langs: 'en' });
  // Prefer exact name match at neighborhood level, then first result
  const exact = data.locations.find(
    l => l.name.en.toLowerCase() === query.toLowerCase() && l.level === 2
  );
  return exact ?? data.locations[0] ?? null;
}

// ── Transactions ──────────────────────────────────────────────────────────────

export interface BayutTransaction {
  transactionId:    string;
  purpose:          'for-sale' | 'for-rent';
  price:            number;
  area:             number;   // sq ft
  location:         string;
  category:         string;
  rooms:            number;
  completionStatus: string;
  date:             string;   // YYYY-MM-DD
}

export interface BayutTransactionsData {
  hits:    BayutTransaction[];
  nbHits:  number;
  page:    number;
  nbPages: number;
}

export interface BayutTransactionsParams {
  purpose:           'for-sale' | 'for-rent';
  locationIds?:      string;    // comma-separated externalIDs
  timePeriod?:       '1m' | '3m' | '6m' | '12m' | '24m';
  categoryIds?:      string;    // 'residential','commercial','apartments','villas',...
  completionStatus?: 'any' | 'completed' | 'under-construction';
  beds?:             string;    // comma-separated, '0' = studio
  priceMin?:         number;
  priceMax?:         number;
  sortBy?:           'date_desc' | 'date_asc' | 'price_desc' | 'price_asc';
  page?:             number;
}

export async function bayutTransactions(
  params: BayutTransactionsParams
): Promise<BayutTransactionsData> {
  const q: Record<string, string> = {
    purpose:    params.purpose,
    time_period: params.timePeriod  ?? '12m',
    sort_by:    params.sortBy       ?? 'date_desc',
    page:       String(params.page  ?? 1),
  };
  if (params.locationIds)      q.location_ids      = params.locationIds;
  if (params.categoryIds)      q.category_ids      = params.categoryIds;
  if (params.completionStatus) q.completion_status = params.completionStatus;
  if (params.beds)             q.beds              = params.beds;
  if (params.priceMin)         q.price_min         = String(params.priceMin);
  if (params.priceMax)         q.price_max         = String(params.priceMax);

  return bayutGet<BayutTransactionsData>('/transactions', q);
}

// ── Normalise to a shape MapApp already understands ──────────────────────────

export interface NormalisedTransaction {
  id:          string;
  date:        string;   // YYYY-MM-DD
  type:        string;   // 'Sale' | 'Rent'
  propType:    string;   // 'Apartment' | 'Villa' | ...
  areaSqft:    number;
  areaSqm:     number;
  priceFull:   number;   // AED
  psfAED:      number;   // AED / sqft
  rooms:       string;   // '1 B/R' | 'Studio' | ...
  location:    string;
  status:      string;   // 'Completed' | 'Off-Plan'
}

function roomLabel(rooms: number): string {
  if (rooms === 0) return 'Studio';
  return `${rooms} B/R`;
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    apartments:  'Apartment',
    villas:      'Villa',
    townhouses:  'Townhouse',
    residential: 'Residential',
    commercial:  'Commercial',
    offices:     'Office',
    shops:       'Shop',
  };
  return map[cat.toLowerCase()] ?? cat;
}

export function normaliseBayutTx(tx: BayutTransaction): NormalisedTransaction {
  const areaSqft = tx.area;
  const areaSqm  = Math.round(areaSqft / 10.764 * 10) / 10;
  const psfAED   = areaSqft > 0 ? Math.round(tx.price / areaSqft) : 0;

  return {
    id:        tx.transactionId,
    date:      tx.date,
    type:      tx.purpose === 'for-sale' ? 'Sale' : 'Rent',
    propType:  categoryLabel(tx.category),
    areaSqft,
    areaSqm,
    priceFull: tx.price,
    psfAED,
    rooms:     roomLabel(tx.rooms),
    location:  tx.location,
    status:    tx.completionStatus === 'completed' ? 'Completed' : 'Off-Plan',
  };
}
