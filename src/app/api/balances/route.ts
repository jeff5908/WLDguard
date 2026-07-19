import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits, parseAbi } from 'viem';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    // 🚨 FIX: We are safely back on the official World Chain RPC!
    // Since this runs on Vercel's backend, the browser CORS firewall cannot block us.
    const publicClient = createPublicClient({
      transport: http("https://rpc.worldchain.network")
    });

    const WLD_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
    const MORPHO_WLD_VAULT = "0xc3d68deB631FA5896E3a3e6B4e3b1c676E4B490B";

    const BALANCE_ABI = parseAbi([
      'function balanceOf(address account) external view returns (uint256)',
      'function maxWithdraw(address owner) external view returns (uint256)'
    ]);

    // Fetch Liquid WLD (With a fallback to 0 if the node drops the connection)
    const liquidWei = await publicClient.readContract({
      address: WLD_ADDRESS,
      abi: BALANCE_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    }).catch((err) => {
      console.warn("Liquid balance fetch failed, falling back to 0", err);
      return 0n;
    });

    // Fetch Morpho Vault WLD (With a fallback to 0)
    const vaultWei = await publicClient.readContract({
      address: MORPHO_WLD_VAULT,
      abi: BALANCE_ABI,
      functionName: 'maxWithdraw',
      args: [address as `0x${string}`]
    }).catch((err) => {
      console.warn("Vault balance fetch failed, falling back to 0", err);
      return 0n;
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