import { evaluateTradeSignal } from './quant';
import { buildRebalanceSwapBatch, buildYieldDepositBatch } from './transactions';
import { formatUnits, parseUnits } from 'viem';

/**
 * WLDguard - Central Execution Engine
 * 
 * This file acts as the "Glue" between the Quant Math and the On-Chain Transactions.
 * It reads a user's balance, processes the math signal, and outputs the exact 
 * batched transaction payload (if an action is required).
 */

export interface UserBalances {
  wld: string;  // e.g., "1000.5"
  usdc: string; // e.g., "500.00"
}

/**
 * Evaluates the market and generates the necessary transaction payloads for a specific user.
 * 
 * @param userAddress The user's World ID Smart Wallet address
 * @param balances The user's current token balances
 * @param historicalPrices The array of hourly closing prices
 * @returns Array of transaction payloads, or null if no action is needed
 */
export const processAgentAction = (
  userAddress: string,
  balances: UserBalances,
  historicalPrices: number[]
) => {
  // 1. Ask the Quant Engine what the market is doing right now
  const signal = evaluateTradeSignal(historicalPrices);
  const currentPrice = historicalPrices[historicalPrices.length - 1];

  let transactions: any[] = [];

  // ------------------------------------------------------------------------
  // ACTION: TRIM 40% WLD AND YIELD FARM USDC
  // ------------------------------------------------------------------------
  if (signal.action === 'TRIM_WLD' && parseFloat(balances.wld) > 0) {
    // We trim exactly 40% of the user's WLD position to lock in profit
    const wldToSell = parseFloat(balances.wld) * 0.40;
    
    // Calculate expected USDC return and apply 1% max slippage protection
    const expectedUsdc = wldToSell * currentPrice;
    const minUsdcOut = expectedUsdc * 0.99; 

    // Generate the Swap Payload (Includes our 0.1% protocol fee routing)
    const swapTx = buildRebalanceSwapBatch(
      wldToSell.toString(),
      minUsdcOut.toString(),
      true, // isWldToUsdc
      userAddress
    );

    // Generate the Yield Deposit Payload (Puts the new USDC into Morpho for 13% APY)
    const depositTx = buildYieldDepositBatch(
      minUsdcOut.toString(), 
      'USDC', 
      userAddress
    );

    // Bundle them together for a seamless 1-click (or zero-click via Session Key) execution
    transactions = [...swapTx, ...depositTx];
    
    return {
      status: 'EXECUTE',
      description: `Market Overextended. Trimming ${wldToSell.toFixed(2)} WLD at $${currentPrice.toFixed(2)}. Reinvesting into USDC Vault at 13.34% APY.`,
      transactions
    };
  }

  // ------------------------------------------------------------------------
  // ACTION: BUY THE DIP (Deploy 100% of USDC back into WLD)
  // ------------------------------------------------------------------------
  if (signal.action === 'BUY_WLD' && parseFloat(balances.usdc) > 0) {
    // We deploy 100% of the parked stablecoins to accumulate WLD at a heavy discount
    const usdcToSpend = parseFloat(balances.usdc);
    
    // Calculate expected WLD return and apply 1% max slippage protection
    const expectedWld = usdcToSpend / currentPrice;
    const minWldOut = expectedWld * 0.99;

    // Generate the Swap Payload
    const swapTx = buildRebalanceSwapBatch(
      usdcToSpend.toString(),
      minWldOut.toString(),
      false, // isWldToUsdc (False because we are buying WLD)
      userAddress
    );

    // Generate the Yield Deposit Payload (Puts the new WLD into Morpho for 13.57% APY)
    const depositTx = buildYieldDepositBatch(
      minWldOut.toString(), 
      'WLD', 
      userAddress
    );

    transactions = [...swapTx, ...depositTx];

    return {
      status: 'EXECUTE',
      description: `Market Capitulation. Deploying $${usdcToSpend.toFixed(2)} to accumulate ~${expectedWld.toFixed(2)} WLD at discount. Depositing to WLD Vault.`,
      transactions
    };
  }

  // ------------------------------------------------------------------------
  // ACTION: HOLD AND CHILL
  // ------------------------------------------------------------------------
  return {
    status: 'HOLD',
    description: `Market is stable. Current Price: $${currentPrice.toFixed(2)}. Let your assets continue earning passive vault yield.`,
    transactions: []
  };
};
