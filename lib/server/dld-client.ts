/**
 * Server-side DLD gateway client.
 *
 * Key design decisions:
 * - All calls are server-side only → bypasses CORS lock to dubailand.gov.ae
 * - Captcha on the DLD portal is browser-only → no captcha needed here
 * - 800ms minimum gap between requests → avoids bot detection / rate limits
 * - 10s timeout → fail fast rather than hanging a Vercel function
 * - consumer-key comes from env var with public fallback (the key is in DLD's own page JS)
 */

const DLD_GATEWAY   = 'https://gateway.dubailand.gov.ae/open-data';
const RENTAL_INDEX  = 'https://ext.dubailand.gov.ae/rentalindex';
// consumer-id is the header name used in the DLD portal's own boot-1.0.4.js (buildHeaders fn)
const CONSUMER_KEY  = process.env.DLD_CONSUMER_KEY ?? 'lMR2xhC1OyK1t46MgjyVv0W8mit4cGN2';
const MIN_GAP_MS    = 800;   // min ms between requests to same base URL
const TIMEOUT_MS    = 15_000;

// Per-base-URL rate limiter (module-level, resets on cold start)
const lastCall: Record<string, number> = {};

async function rateLimit(baseUrl: string): Promise<void> {
  const now  = Date.now();
  const last = lastCall[baseUrl] ?? 0;
  const wait = MIN_GAP_MS - (now - last);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall[baseUrl] = Date.now();
}

/** Creates a fetch-compatible AbortSignal that fires after `ms` milliseconds. */
function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// ── DLD Gateway POST (transactions, rents, buildings, units, areas…)
export async function dldPost<T = unknown>(
  command: string,
  params: Record<string, string>,
): Promise<T> {
  await rateLimit(DLD_GATEWAY);

  const url = `${DLD_GATEWAY}/${command}`;

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Accept':        'application/json, */*',
      // DLD portal boot.js buildHeaders() uses 'consumer-id' (not 'consumer-key')
      'consumer-id':   CONSUMER_KEY,
      'AppUser':       '',
      'Origin':        'https://dubailand.gov.ae',
      'Referer':       'https://dubailand.gov.ae/en/open-data/real-estate-data/',
      'User-Agent':    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body:   JSON.stringify(params),
    signal: timeoutSignal(TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`DLD ${command} → HTTP ${res.status}`);
  }

  const json = await res.json() as { response?: T };
  if (!json?.response) throw new Error(`DLD ${command} → unexpected response shape`);
  return json.response;
}

// ── Rental Index GET (ext.dubailand.gov.ae — different base, no POST body)
export async function dldRentalIndex<T = unknown>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  await rateLimit(RENTAL_INDEX);

  const qs  = new URLSearchParams(params).toString();
  const url = `${RENTAL_INDEX}/${path}${qs ? '?' + qs : ''}`;

  const res = await fetch(url, {
    headers: {
      'Accept':     'application/json',
      'Origin':     'https://dubailand.gov.ae',
      'Referer':    'https://dubailand.gov.ae/',
      'User-Agent': 'Mozilla/5.0 (compatible; PropMapDubai/1.0)',
    },
    signal: timeoutSignal(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Rental index ${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Typed response shapes ─────────────────────────────────────────────────────

export interface DLDTransaction {
  TRANSACTION_NUMBER:   string;
  INSTANCE_DATE:        string;
  TRANSACTION_TYPE_EN:  string;
  REG_TYPE_EN:          string;
  IS_FREE_HOLD:         string;
  USAGE_EN:             string;
  AREA_EN:              string;
  PROP_TYPE_EN:         string;
  PROP_SUB_TYPE_EN:     string;
  AMOUNT:               number;
  TRANSACTION_SIZE_SQM: number;
  PROPERTY_SIZE_SQM:    number;
  ROOMS_EN:             string;
  PARKING:              number;
  NEAREST_METRO_EN:     string;
  NEAREST_MALL_EN:      string;
  NEAREST_LANDMARK_EN:  string;
  TOTAL_BUYER:          number;
  TOTAL_SELLER:         number;
  MASTER_PROJECT_EN:    string;
  PROJECT_EN:           string;
  TOTAL:                number;
}

export interface DLDRent {
  CONTRACT_AMOUNT:    number;
  START_DATE:         string;
  END_DATE:           string;
  AREA_EN:            string;
  PROP_TYPE_EN:       string;
  PROP_SUB_TYPE_EN:   string;
  ROOMS_EN:           string;
  PROPERTY_SIZE_SQM:  number;
  EJARI_PROP_TYPE_EN: string;
  IS_FREE_HOLD:       string;
  VERSION:            string;
  TOTAL:              number;
}

export interface DLDArea {
  AREA_ID:   number;
  AREA_EN:   string;
  AREA_AR:   string;
}

export interface DLDBuilding {
  BUILDING_ID:    number;
  BUILDING_NAME_EN: string;
  AREA_EN:        string;
  FLOORS_COUNT:   number;
  UNITS_COUNT:    number;
  IS_FREE_HOLD:   string;
  TOTAL:          number;
}

export interface DLDResponse<T> {
  result: T[];
}
