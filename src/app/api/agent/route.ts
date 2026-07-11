import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma'; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Official World Chain Contracts
const WLD_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
const USDC_ADDRESS = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";
const MORPHO_WLD_VAULT = "0xc3d68deB631FA5896E3a3e6B4e3b1c676E4B490B";
const MORPHO_USDC_VAULT = "0x5403063cbce1df2f61e8787f0a8d56b4bd4b1239";

// Smart Contract ABIs
const ERC20_ABI = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
const ERC4626_ABI = [{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userAddress = body.userAddress;

    // 1. Fetch the user's real balance AND their most recent trade from the database
    const user = await prisma.user.findUnique({
      where: { walletAddress: userAddress },
      include: {
        trades: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // 1b. 🚨 COOLDOWN LOGIC: Prevent over-trading during a prolonged breakout
    if (user && user.trades.length > 0) {
      const lastTradeTime = new Date(user.trades[0].createdAt).getTime();
      const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000); // 12 hour cooldown

      if (lastTradeTime > twelveHoursAgo) {
        return NextResponse.json({
          status: 'success',
          proposal: {
            type: 'REBALANCED_TODAY',
            description: 'You successfully captured volatility today! WLDguard is holding your position in cooldown mode to prevent over-trading and protect your gains.',
            expectedYield: 'Passive Yield Active',
            txData: null // Null prevents the UI from generating a transaction button
          }
        });
      }
    }

    // 2. Fetch the MOST RECENT decision from your 24/7 AI Daemon
    const latestProposal = await prisma.proposal.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestProposal) {
      throw new Error("No proposals found. Daemon might still be booting.");
    }

    let txData = null;
    let finalDescription = latestProposal.description;
    let finalType = latestProposal.type;

    // 3A. BUY WLD LOGIC (Requires USDC)
    if (latestProposal.type === 'BUY_WLD') {
        const usdcBalance = user?.usdcBalance || 0;
        
        if (usdcBalance <= 0) {
            // OVERRIDE: User has no USDC to buy with!
            finalType = 'MISSED OPPORTUNITY (NO USDC)';
            finalDescription = `AI Signal: Market is Oversold. However, you have 0 USDC available to deploy. Please deposit USDC to automate dip-buying.`;
            txData = null; 
        } else {
            // (Future implementation: Insert actual Uniswap USDC->WLD swap logic here)
            // For now, we will simulate depositing their USDC into the Morpho USDC vault
            const dynamicAmount = usdcBalance * 0.10; 
            const amountWei = BigInt(Math.floor(dynamicAmount * 1e6)).toString(); // USDC uses 6 decimals

            txData = [
              {
                address: USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [MORPHO_USDC_VAULT, amountWei]
              },
              {
                address: MORPHO_USDC_VAULT,
                abi: ERC4626_ABI,
                functionName: 'deposit',
                args: [amountWei, userAddress]
              }
            ];
        }
    }

    // 3B. TRIM WLD LOGIC (Requires WLD)
    else if (latestProposal.type === 'TRIM_WLD' || latestProposal.type === 'DEPOSIT_WLD') {
        const wldBalance = user?.wldBalance || 0;
        
        if (wldBalance <= 0) {
            finalType = 'INSUFFICIENT WLD';
            finalDescription = `AI Signal triggered, but you have 0 WLD available in your portfolio.`;
            txData = null;
        } else {
            const dynamicAmount = wldBalance * 0.10; 
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
        type: finalType,
        description: finalDescription,
        expectedYield: latestProposal.expectedYield,
        txData: txData 
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch signal', details: error.message }, { status: 500 });
  }
}