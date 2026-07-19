import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 🚨 BETA TEST BYPASS: We have removed the Prisma import entirely.
  // This physically guarantees Vercel will not crash on module resolution.
  // It will instantly send the HOLD signal so your frontend can intercept it!
  
  return NextResponse.json({
    status: 'success',
    signal: 'HOLD',
    price: '0.420'
  });
}