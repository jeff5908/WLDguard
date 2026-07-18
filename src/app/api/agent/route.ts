import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const { userAddress } = await req.json();

    // 1. Resolve User (Auto-create a beta profile if they don't exist yet)
    let user = await prisma.user.findUnique({
       where: { walletAddress: userAddress }
    });
    
    if (!user) {
        user = await prisma.user.create({
            data: {
                worldId: `beta-${Date.now()}`,
                walletAddress: userAddress,
                wldBalance: 100
            }
        });
    }

    // 2. THE NERVOUS SYSTEM COOLDOWN: Did they trade in the last 12 hours?
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const recentTrade = await prisma.trade.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: twelveHoursAgo }
      }
    });

    if (recentTrade) {
      return NextResponse.json({
        status: 'success',
        proposal: {
          type: 'COOLDOWN',
          description: 'Dip successfully bought. WLDguard is resting your account for 12 hours to prevent over-exposure to consecutive market signals.',
          expectedYield: 'Protected Status',
          txData: null // Prevents the Execute button from appearing
        }
      });
    }

    // 3. THE LIVE BRAIN: Fetch the MOST RECENT decision from your 24/7 AI Daemon
    const latestProposal = await prisma.proposal.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let finalType = latestProposal?.type || 'HOLD';
    let finalDescription = latestProposal?.description || 'Market is stable. Let your assets continue earning passive vault yield.';
    let expectedYield = latestProposal?.expectedYield || '12.88% APY (WLD Vault)';
    let txData = null;

    // 4. Construct the Transaction Payload based on the LIVE signal
    if (finalType === 'BUY_WLD' || finalType === 'TRIM_WLD') {
        // We use a safe dummy transfer here so your physical phone hardware bridge 
        // accepts the signature without failing during our beta test!
        txData = [{
          address: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003', // Official WLD Token Contract
          abi: [{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
          functionName: 'transfer',
          args: [userAddress, '10000000000000000000'] // 10 WLD Test Payload
        }];
    }

    return NextResponse.json({
      status: 'success',
      proposal: {
        type: finalType,
        description: finalDescription,
        expectedYield: expectedYield,
        txData: txData
      }
    });

  } catch (error: any) {
    console.error('Agent API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch signal' }, { status: 500 });
  }
}