import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits, parseAbi, fallback } from 'viem';
import { worldchain } from 'viem/chains';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    // 🚨 ULTIMATE FIX: We are using a Fallback array of 3 different enterprise RPCs.
    // If the network blocks Vercel's IP on one, viem instantly routes to the next!
    const publicClient = createPublicClient({
      chain: worldchain,
      transport: fallback([
        http("https://worldchain-mainnet.g.alchemy.com/public"),
        http("https://worldchain.drpc.org"),
        http("https://480.rpc.thirdweb.com")
      ])
    });

    const WLD_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
    const MORPHO_WLD_VAULT = "0xc3d68deB631FA5896E3a3e6B4e3b1c676E4B490B";

    const BALANCE_ABI = parseAbi([
      'function balanceOf(address account) external view returns (uint256)',
      'function maxWithdraw(address owner) external view returns (uint256)'
    ]);

    // We intentionally removed the `.catch(() => 0n)` safety net!
    // If the connection fails, we WANT it to crash so your phone shows 404.404.
    const liquidWei = await publicClient.readContract({
      address: WLD_ADDRESS,
      abi: BALANCE_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });

    const vaultWei = await publicClient.readContract({
      address: MORPHO_WLD_VAULT,
      abi: BALANCE_ABI,
      functionName: 'maxWithdraw',
      args: [address as `0x${string}`]
    });

    return NextResponse.json({
      liquid: Number(formatUnits(liquidWei as bigint, 18)),
      vault: Number(formatUnits(vaultWei as bigint, 18))
    });

  } catch (error: any) {
    console.error("Server Balance Fetch Error:", error.message);
    return NextResponse.json({ error: error.message || 'Failed to fetch live balances' }, { status: 500 });
  }
}