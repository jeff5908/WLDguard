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
    // 🚨 ULTIMATE FIX: Fallback Array. If Alchemy blocks Vercel's AWS IP, 
    // viem will instantly reroute to DRPC, ThirdWeb, or the Official Node!
    const publicClient = createPublicClient({
      chain: worldchain,
      transport: fallback([
        http("https://worldchain-mainnet.g.alchemy.com/public"),
        http("https://worldchain.drpc.org"),
        http("https://480.rpc.thirdweb.com"),
        http("https://rpc.worldchain.network")
      ])
    });

    const WLD_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
    const MORPHO_WLD_VAULT = "0xc3d68deB631FA5896E3a3e6B4e3b1c676E4B490B";

    const BALANCE_ABI = parseAbi([
      'function balanceOf(address account) external view returns (uint256)',
      'function maxWithdraw(address owner) external view returns (uint256)'
    ]);

    // 🚨 INDIVIDUAL SAFETY NETS: If the Vault fails, the Liquid Balance survives!
    const liquidWei = await publicClient.readContract({
      address: WLD_ADDRESS,
      abi: BALANCE_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    }).catch((err) => {
      console.error("Liquid Balance Error:", err.message);
      return 0n; 
    });

    const vaultWei = await publicClient.readContract({
      address: MORPHO_WLD_VAULT,
      abi: BALANCE_ABI,
      functionName: 'maxWithdraw',
      args: [address as `0x${string}`]
    }).catch((err) => {
      console.error("Vault Balance Error:", err.message);
      return 0n; 
    });

    return NextResponse.json({
      liquid: Number(formatUnits(liquidWei as bigint, 18)),
      vault: Number(formatUnits(vaultWei as bigint, 18))
    });

  } catch (error: any) {
    console.error("Server Balance Fetch Error:", error.message);
    return NextResponse.json({ liquid: 0, vault: 0, total: 404.404040 });
  }
}