import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GATEWAY   = 'https://gateway.dubailand.gov.ae/open-data';
const CONSUMER  = process.env.DLD_CONSUMER_KEY ?? 'lMR2xhC1OyK1t46MgjyVv0W8mit4cGN2';
const TIMEOUT   = 12_000;

function timeoutSignal(ms: number): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

function fmtHyphen(d: Date) {
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}
function fmtSlash(d: Date) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function fmtISO(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function probe(label: string, headers: Record<string,string>, body: Record<string,string>) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${GATEWAY}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, */*', ...headers },
      body: JSON.stringify(body),
      signal: timeoutSignal(TIMEOUT),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* raw text */ }
    return { label, status: res.status, ms: Date.now()-t0, body: parsed ?? text.slice(0, 300) };
  } catch (e) {
    return { label, status: 0, ms: Date.now()-t0, error: String(e) };
  }
}

/**
 * GET /api/dld/health
 *
 * Tries 4 combinations of header + date format to find which one the DLD gateway accepts.
 * Check this endpoint after deploying to identify the working combination.
 */
export async function GET() {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const baseBody = { P_TAKE: '2', P_SKIP: '0' };

  const [r1, r2, r3, r4, r5] = await Promise.all([
    // Format A: consumer-id + DD-MM-YYYY (DLD portal form placeholder format)
    probe('consumer-id + DD-MM-YYYY', { 'consumer-id': CONSUMER, 'AppUser': '' }, {
      ...baseBody, P_FROM_DATE: fmtHyphen(from), P_TO_DATE: fmtHyphen(to),
    }),
    // Format B: consumer-key + DD-MM-YYYY (original code, wrong header)
    probe('consumer-key + DD-MM-YYYY', { 'consumer-key': CONSUMER }, {
      ...baseBody, P_FROM_DATE: fmtHyphen(from), P_TO_DATE: fmtHyphen(to),
    }),
    // Format C: consumer-id + DD/MM/YYYY
    probe('consumer-id + DD/MM/YYYY', { 'consumer-id': CONSUMER, 'AppUser': '' }, {
      ...baseBody, P_FROM_DATE: fmtSlash(from), P_TO_DATE: fmtSlash(to),
    }),
    // Format D: consumer-key + DD/MM/YYYY (original)
    probe('consumer-key + DD/MM/YYYY', { 'consumer-key': CONSUMER }, {
      ...baseBody, P_FROM_DATE: fmtSlash(from), P_TO_DATE: fmtSlash(to),
    }),
    // Format E: no auth header at all (DLD doHttpPostWithCaptcha sends no auth header)
    probe('no-auth + DD-MM-YYYY', {}, {
      ...baseBody, P_FROM_DATE: fmtHyphen(from), P_TO_DATE: fmtHyphen(to),
    }),
  ]);

  // Also test carea-lookup to confirm basic connectivity
  const areaTest = await probe('carea-lookup', { 'consumer-id': CONSUMER }, {});

  const winner = [r1,r2,r3,r4,r5].find(r => r.status === 200);

  return NextResponse.json({
    winner: winner?.label ?? 'none — all failed',
    results: [r1,r2,r3,r4,r5],
    areaLookup: areaTest,
    consumerKey: CONSUMER.slice(0,6) + '…',
    dateRange: { from: fmtHyphen(from), to: fmtHyphen(to) },
  });
}
