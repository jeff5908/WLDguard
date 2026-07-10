import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Official World Chain Contracts
const WLD_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
const MORPHO_WLD_VAULT = "0xc3d68deB631FA5896E3a3e6B4e3b1c676E4B490B";

const ERC20_ABI = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
const ERC4626_ABI = [{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userAddress = body.userAddress;

    // 🚨 FORCED REAL MONEY TEST: 0.01 WLD
    // 10000000000000000 wei = 0.01 WLD
    const amountWei = "10000000000000000";

    const txData = [
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

    return NextResponse.json({
      status: 'success',
      proposal: {
        type: 'PRODUCTION MAINNET TEST',
        description: 'Forcing a live 0.01 WLD deposit into the Morpho Vault to prove Mainnet transaction routing is active.',
        expectedYield: '13.57% APY',
        txData: txData
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}