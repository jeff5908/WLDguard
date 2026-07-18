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
    // 1. Connect to World Chain via server (bypasses browser CORS blocks!)
    const publicClient = createPublicClient({
      transport: http("https://rpc.worldchain.network")
    });

    const WLD_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
    const MORPHO_WLD_VAULT = "0xc3d68deB631FA5896E3a3e6B4e3b1c676E4B490B";

    const BALANCE_ABI = parseAbi([
      'function balanceOf(address account) external view returns (uint256)',
      'function maxWithdraw(address owner) external view returns (uint256)'
    ]);

    // 2. Fetch the live numbers
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

    // 3. Return the exact 18-decimal math to the frontend
    return NextResponse.json({
      liquid: Number(formatUnits(liquidWei as bigint, 18)),
      vault: Number(formatUnits(vaultWei as bigint, 18))
    });

  } catch (error) {
    console.error("Server Balance Fetch Error:", error);
    return NextResponse.json({ error: 'Failed to fetch live balances' }, { status: 500 });
  }
}