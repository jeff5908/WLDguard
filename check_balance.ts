import { createPublicClient, http, formatUnits, parseAbi } from 'viem';
import { worldchain } from 'viem/chains';

const client = createPublicClient({
  chain: worldchain,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public")
});

async function check() {
  const address = "0xE05708839aA1F669598e9120a4bE6d8c6FDBe290";
  const WLD = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
  
  const balance = await client.readContract({
    address: WLD,
    abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
    functionName: 'balanceOf',
    args: [address as `0x${string}`]
  });
  
  console.log(`Balance in WLD contract: ${formatUnits(balance, 18)}`);
}
check();
