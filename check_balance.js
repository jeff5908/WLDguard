import { createPublicClient, http, formatUnits, parseAbi } from 'viem';
import { worldchain } from 'viem/chains';

const client = createPublicClient({
  chain: worldchain,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public")
});

async function check() {
  const address = "0x30e31bff169c1e2afd4f3456957d768d8b7185d7";
  const WLD = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
  
  try {
    const balance = await client.readContract({
      address: WLD,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [address]
    });
    
    console.log(`\n✅ TRUE BALANCE ON WORLD CHAIN: ${formatUnits(balance, 18)} WLD\n`);
  } catch (err) {
    console.error("❌ BLOCKCHAIN ERROR:", err.message);
  }
}
check();
