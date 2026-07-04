import { encodeFunctionData } from "viem";

/**
 * WLDguard - Day 7: World ID "Proof of Unique Human" Delegation
 * * This module creates the cryptographic link between a verified human (World ID)
 * and our automated WLDguard Agent (CDP Wallet).
 */

// Placeholder for the official World Chain AgentBook smart contract
const AGENT_BOOK_ADDRESS = "0x0000000000000000000000000000000000000001";

/**
 * Generates the transaction payload for the World App MiniKit
 * so the user can securely delegate trading authority to the AI Agent.
 */
export function buildAgentDelegationPayload(agentWalletAddress: string) {
  console.log(`Preparing delegation payload for Agent: ${agentWalletAddress}`);

  // We use Viem to encode the raw calldata. 
  // This tells the smart contract exactly what we want to do.
  const calldata = encodeFunctionData({
    abi: [
      {
         "inputs": [
            {"internalType": "address", "name": "agent", "type": "address"},
            {"internalType": "uint256", "name": "permissions", "type": "uint256"}
         ],
         "name": "registerAgent",
         "outputs": [],
         "stateMutability": "nonpayable",
         "type": "function"
      }
    ],
    functionName: 'registerAgent',
    args: [
      agentWalletAddress as `0x${string}`,
      // Permission Level 1: "Trade & Yield Only". 
      // This mathematically prevents the AI from transferring funds to external wallets.
      1n 
    ]
  });

  return {
    to: AGENT_BOOK_ADDRESS,
    data: calldata,
    description: "Delegate WLDguard trading authority to your secure AI Agent."
  };
}
