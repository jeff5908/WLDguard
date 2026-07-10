import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma'; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Official World Chain Contracts
const WLD_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
const MORPHO_WLD_VAULT = "0xc3d68deB631FA5896E3a3e6B4e3b1c676E4B490B";

// Smart Contract ABIs
const ERC20_ABI = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
const ERC4626_ABI = [{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userAddress = body.userAddress;

    // 1. Fetch the user's real balance from the database
    const user = await prisma.user.findUnique({
      where: { walletAddress: userAddress }
    });

    // 2. Fetch the MOST RECENT decision from your 24/7 AI Daemon
    const latestProposal = await prisma.proposal.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestProposal) {
      throw new Error("No proposals found. Daemon might still be booting.");
    }

    let txData = null;

    // 3. If the AI decided to act, dynamically calculate the payload based on real balances
    if (latestProposal.type === 'TRIM_WLD' || latestProposal.type === 'BUY_WLD' || latestProposal.type === 'DEPOSIT_WLD') {
        const wldBalance = user?.wldBalance || 0;
        
        // Calculate 10% of their actual balance dynamically
        if (wldBalance > 0) {
            const dynamicAmount = wldBalance * 0.10; 
            
            // Convert to blockchain math (18 zeros) safely without external dependencies
            const amountWei = BigInt(Math.floor(dynamicAmount * 1e18)).toString();

            txData = [
              {
                address: WLD_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [MORPHO_WLD_VAULT, amountWei]
              },
              {
                address: MORPHO_WLD_VAULT,
                abi: ERC4626_ABI,
                functionName: 'deposit',
                args: [amountWei, userAddress]
              }
            ];
        }
    }

    // 4. Return the TRUE live proposal directly to the phone screen
    return NextResponse.json({
      status: 'success',
      proposal: {
        type: latestProposal.type,
        description: latestProposal.description,
        expectedYield: latestProposal.expectedYield,
        txData: txData // Will be null if the AI says 'HOLD'
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch signal', details: error.message }, { status: 500 });
  }
}