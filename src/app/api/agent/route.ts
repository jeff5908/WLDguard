import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma'; 

// 🚨 CRITICAL FIX: Tell Vercel to NEVER cache this API route!
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. Handles the button click from the World App (POST)
export async function POST(req: Request) {
  return await fetchLatestSignal();
}

// 2. Handles direct visits from your Chromebook browser for easy testing! (GET)
export async function GET(req: Request) {
  return await fetchLatestSignal();
}

// Core database logic
async function fetchLatestSignal() {
  try {
    const latestProposal = await prisma.proposal.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestProposal) {
      return NextResponse.json({
        status: 'neutral',
        message: 'Market stable, no action required.',
        proposal: null
      });
    }

    return NextResponse.json({
      status: 'success',
      proposal: {
        type: latestProposal.type,
        description: latestProposal.description,
        expectedYield: latestProposal.expectedYield,
        txData: [{ to: "0xMock", data: "0x00" }] 
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch signal from database',
      details: error.message 
    }, { status: 500 });
  }
}