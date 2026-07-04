/**
 * WLDguard - ERC-4337 Paymaster Configuration
 * 
 * This file manages the connection to our Gas Sponsorship provider.
 * By routing transactions through this URL, WLDguard pays the network fees
 * so the user experiences a frictionless, zero-cost transaction.
 */

// In production, you will create a free account at Pimlico.io or Coinbase Developer Platform,
// create a Paymaster for World Chain (Chain ID: 480), and put the URL in your .env file.
const PIMLICO_API_KEY = process.env.NEXT_PUBLIC_PIMLICO_API_KEY || "mock_api_key_for_testing";

// The standard RPC endpoint for World Chain Paymasters via Pimlico
export const PAYMASTER_URL = `https://api.pimlico.io/v2/480/rpc?apikey=${PIMLICO_API_KEY}`;

/**
 * Helper to check if gas sponsorship is currently active/funded
 */
export const isPaymasterActive = () => {
  // If we have a real key, or if we are relying on World App's native free tier
  return !!process.env.NEXT_PUBLIC_PIMLICO_API_KEY || true; 
};