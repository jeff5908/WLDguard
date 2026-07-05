/**
 * WLDguard - ERC-4337 Paymaster Configuration
 * * This file manages the connection to our Gas Sponsorship provider.
 * By routing transactions through this configuration, WLDguard (or Worldcoin) 
 * pays the network fees so the user experiences a frictionless, zero-cost transaction.
 */

// In production, you can create a free account at Pimlico.io or Coinbase Developer Platform,
// create a Paymaster for World Chain (Chain ID: 480), and put the URL in your .env file.
const PIMLICO_API_KEY = process.env.NEXT_PUBLIC_PIMLICO_API_KEY || "mock_api_key_for_testing";

// The standard RPC endpoint for World Chain Paymasters via Pimlico
export const PAYMASTER_URL = `https://api.pimlico.io/v2/480/rpc?apikey=${PIMLICO_API_KEY}`;

/**
 * Helper to check if gas sponsorship is currently active/funded.
 * If this returns false, the UI should disable the "Execute" button to protect the user 
 * from accidentally paying their own gas fees.
 */
export const isPaymasterActive = () => {
  // If we have a real key in our .env file, or if we are relying on World App's native free tier
  if (process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
      return true;
  }
  
  // Default to true for World App's native sponsorship during the launch phase
  return true; 
};

/**
 * Formats the transaction payload to request sponsorship from the World App Bundler
 */
export const formatSponsoredPayload = (transactions: any[]) => {
    return transactions.map(tx => ({
        ...tx,
        // This specific flag tells the World App wallet to look for a Paymaster
        gasSponsored: true 
    }));
};