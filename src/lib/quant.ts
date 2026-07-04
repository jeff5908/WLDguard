/**
 * WLDguard - Quantitative Math & Signal Engine
 * 
 * This module contains the proprietary technical analysis logic.
 * It is completely off-chain and will run on our 24/7 VPS daemon.
 */

/**
 * Calculates the Simple Moving Average (SMA)
 * @param prices Array of historical closing prices (oldest to newest)
 * @param period The lookback period (e.g., 20)
 */
export const calculateSMA = (prices: number[], period: number): number | null => {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
};

/**
 * Calculates the Standard Deviation for a given dataset
 * @param prices Array of historical closing prices
 * @param period The lookback period
 * @param sma The previously calculated SMA for this period
 */
const calculateStandardDeviation = (prices: number[], period: number, sma: number): number | null => {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  
  // Variance is the average of the squared differences from the Mean (SMA)
  const squaredDifferences = slice.map(price => Math.pow(price - sma, 2));
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / period;
  
  return Math.sqrt(variance);
};

/**
 * Calculates the Upper and Lower Bollinger Bands
 * @param prices Array of historical closing prices
 * @param period Lookback period (default 20)
 * @param multiplier Standard deviation multiplier (default 2.0)
 */
export const calculateBollingerBands = (prices: number[], period = 20, multiplier = 2.0) => {
  const sma = calculateSMA(prices, period);
  if (sma === null) return null;

  const stdDev = calculateStandardDeviation(prices, period, sma);
  if (stdDev === null) return null;

  return {
    sma,
    upperBand: sma + (stdDev * multiplier),
    lowerBand: sma - (stdDev * multiplier)
  };
};

/**
 * Calculates the Exponential Moving Average (EMA)
 * We iterate through the array to properly weight recent data.
 * @param prices Array of historical closing prices
 * @param period Lookback period (e.g., 200)
 */
export const calculateEMA = (prices: number[], period: number): number | null => {
  if (prices.length < period) return null;
  
  const k = 2 / (period + 1);
  // Start the EMA with the SMA of the first 'period' elements
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Apply the multiplier for the rest of the array
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
  }
  
  return ema;
};

/**
 * THE WLDGUARD SIGNAL EVALUATOR
 * Compares current price against our indicators to determine the automated action.
 */
export const evaluateTradeSignal = (prices: number[]) => {
  const currentPrice = prices[prices.length - 1];
  
  // Calculate our core metrics based on the backtest parameters
  const bands = calculateBollingerBands(prices, 20, 2.0);
  const ema200 = calculateEMA(prices, 200);

  if (!bands || !ema200) {
    return { action: 'HOLD', reason: 'Insufficient data' };
  }

  // LOGIC 1: Overextended Bull Breakout + Above 200 EMA
  // Action: Harvest volatility. Trim WLD into USDC to earn 13% APY on stablecoins.
  if (currentPrice > bands.upperBand && currentPrice > ema200) {
    return {
      action: 'TRIM_WLD',
      targetPrice: currentPrice,
      reason: 'Price pierced Upper BB in an uptrend. Harvesting volatility.'
    };
  }

  // LOGIC 2: Overextended Panic Sell-off
  // Action: Reinvest. Use stablecoins to buy WLD at a severe discount.
  if (currentPrice < bands.lowerBand) {
    return {
      action: 'BUY_WLD',
      targetPrice: currentPrice,
      reason: 'Price pierced Lower BB. Buying the fear dip.'
    };
  }

  // LOGIC 3: Chop / Consolidation
  // Action: Do nothing, let Morpho vaults earn passive yield.
  return {
    action: 'HOLD',
    targetPrice: currentPrice,
    reason: 'Price is within bands. Continuing to farm yield.'
  };
};
