import { NextResponse } from 'next/server';
import { dldPost } from '@/lib/server/dld-client';

export const runtime = 'nodejs';

/**
 * GET /api/dld/health
 * Quick smoke test — fetches 1 transaction from the last 30 days.
 * Use this to verify the DLD gateway is reachable from Vercel.
 */
export async function GET() {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

  const start = Date.now();
  try {
    const data = await dldPost('transactions', {
      P_FROM_DATE: fmt(from),
      P_TO_DATE:   fmt(to),
      P_TAKE: '1',
      P_SKIP: '0',
      P_SORT: 'INSTANCE_DATE_DESC',
    });

    return NextResponse.json({
      status:   'ok',
      latencyMs: Date.now() - start,
      sample:   data,
    });
  } catch (err) {
    return NextResponse.json({
      status:    'error',
      latencyMs: Date.now() - start,
      error:     String(err),
    }, { status: 502 });
  }
}
