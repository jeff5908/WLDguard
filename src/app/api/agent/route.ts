import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Handle both property names just in case the frontend changes
    const userAddress = body.userId || body.userAddress;

    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 });
    }

    // 1. Fetch the latest proposal created by your Render Daemon from the DB
    const latestProposal = await prisma.proposal.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // 2. If the DB is empty, default to a safe Hold
    if (!latestProposal) {
      return NextResponse.json({
        status: 'success',
        proposal: {
          type: 'HOLD',
          description: 'Market is stable. Let your assets continue earning passive vault yield.',
          expectedYield: '12.88% APY (WLD Vault)',
          txData: null
        }
      });
    }

    // 3. Return the exact proposal from the Daemon to the UI
    return NextResponse.json({
      status: 'success',
      proposal: {
        type: latestProposal.type,
        description: latestProposal.description,
        expectedYield: latestProposal.expectedYield,
        // Only attach a transaction payload if the AI wants us to execute a trade
        txData: latestProposal.type !== 'HOLD' ? [
          {
            to: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
            data: "0x095ea7b3000000000000000000000000c3d68deb631fa5896e3a3e6b4e3b1c676e4b490b0000000000000000000000000000000000000000000000008ac7230489e80000",
            description: `Execute ${latestProposal.type}`
          }
        ] : null
      }
    });

  } catch (error: any) {
    console.error('Agent API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch signal from database' }, { status: 500 });
  }
}