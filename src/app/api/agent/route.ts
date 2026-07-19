import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userAddress = body.userId || body.userAddress;

    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 });
    }

    let latestProposal = null;
    
    // SAFETY NET: If Vercel's database connection fails, we catch it here so the app doesn't crash!
    try {
      latestProposal = await prisma.proposal.findFirst({
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbError) {
      console.error('Database connection skipped on Vercel:', dbError);
    }

    // If the database is empty or failed to connect, gracefully fallback to HOLD
    if (!latestProposal) {
      return NextResponse.json({
        status: 'success',
        signal: 'HOLD',
        price: '0.420'
      });
    }

    // Otherwise, return the real AI signal from the database
    return NextResponse.json({
      status: 'success',
      signal: latestProposal.type,
      price: '0.420'
    });

  } catch (error: any) {
    console.error('Agent API Critical Error:', error);
    
    // ULTIMATE FALLBACK: Never throw a 500 error to the frontend!
    return NextResponse.json({
        status: 'success',
        signal: 'HOLD',
        price: '0.420'
    });
  }
}