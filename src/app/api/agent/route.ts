import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma'; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Official World Chain Contracts
const WLD_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
const MORPHO_WLD_VAULT = "0xc3d68deB631FA5896E3a3e6B4e3b1c676E4B490B";

// The exact amount to test: 1 WLD (in blockchain math, this is 1 followed by 18 zeros)
const ONE_WLD = "1000000000000000000";

// Smart Contract ABIs
const ERC20_ABI = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
const ERC4626_ABI = [{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userAddress = body.userAddress;

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
        type: "BETA DEPOSIT",
        description: "BETA TEST: Routing exactly 1.0 WLD into the Morpho Yield Vault to verify our smart contract infrastructure.",
        expectedYield: "13.57% APY (Morpho)",
        txData: [
          // Transaction 1: Give Morpho permission to move 1 WLD
          {
            address: WLD_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [MORPHO_WLD_VAULT, ONE_WLD]
          },
          // Transaction 2: Deposit the 1 WLD into the Vault
          {
            address: MORPHO_WLD_VAULT,
            abi: ERC4626_ABI,
            functionName: 'deposit',
            args: [ONE_WLD, userAddress]
          }
        ]
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch signal', details: error.message }, { status: 500 });
  }
}