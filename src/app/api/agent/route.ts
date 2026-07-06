import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma'; 

// 🚨 CRITICAL FIX: Tell Vercel to NEVER cache this API route!
// Without this, Next.js freezes the response and serves stale data.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    // 1. Fetch the absolute latest proposal your Daemon just pushed to the database
    const latestProposal = await prisma.proposal.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // 2. If the database is empty (Daemon hasn't triggered yet)
    if (!latestProposal) {
      return NextResponse.json({
        status: 'neutral',
        message: 'Market stable, no action required.',
        proposal: null
      });
    }

    // 3. If there IS a signal, send it to the frontend UI!
    return NextResponse.json({
      status: 'success',
      proposal: {
        type: latestProposal.type,
        description: latestProposal.description,
        expectedYield: latestProposal.expectedYield,
        // We add dummy txData here just so the UI "Sign & Execute" button doesn't break
        txData: [{ to: "0xMock", data: "0x00" }] 
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch signal from database' }, { status: 500 });
  }
}