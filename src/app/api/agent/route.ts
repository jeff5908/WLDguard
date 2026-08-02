import { NextResponse } from 'next/server';

// 🚨 Production Endpoint for Intent Generation
export const dynamic = 'force-dynamic';

function calculateSMA(prices: number[], period: number) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((acc, val) => acc + val, 0) / period;
}

function calculateStandardDeviation(prices: number[], period: number, sma: number) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
    return Math.sqrt(variance);
}

export async function POST(req: Request) {
  try {
    const { balances } = await req.json();

    // 1. Fetch live historical data from MEXC
    const response = await fetch('https://api.mexc.com/api/v3/klines?symbol=WLDUSDT&interval=60m&limit=20');
    if (!response.ok) throw new Error("MEXC API Failed");
    const data = await response.json();
    
    const prices = data.map((candle: any[]) => parseFloat(candle[4]));
    const livePrice = prices[prices.length - 1];

    // 2. Calculate the statistical bounds (Bollinger Bands)
    const sma = calculateSMA(prices, 20);
    const stdDev = calculateStandardDeviation(prices, 20, sma!);
    const upperBand = sma! + (stdDev! * 2.0);
    const lowerBand = sma! - (stdDev! * 2.0);

    let proposal = null;

    // Determine intent based on user's current holdings
    // If they have liquid WLD (or WLD in the vault), they need a SELL intent
    // If they are parked in USDC, they need a BUY intent
    if (balances.vault > 0 || balances.liquid > 0) {
        proposal = {
            type: "SELL_INTENT",
            targetPrice: `$${upperBand.toFixed(3)}`,
            description: `Based on current rolling volatility, the statistical ceiling for WLD this week is $${upperBand.toFixed(3)}. Sign this Intent to automatically sell 40% to USDC if this target is hit.`,
            expectedYield: "12.24% APY (Post-Execution USDC Vault)"
        };
    } else {
        proposal = {
            type: "BUY_INTENT",
            targetPrice: `$${lowerBand.toFixed(3)}`,
            description: `Based on current rolling volatility, the statistical floor for WLD this week is $${lowerBand.toFixed(3)}. Sign this Intent to automatically deploy your parked USDC to buy WLD if the price drops to this target.`,
            expectedYield: "12.88% APY (Post-Execution WLD Vault)"
        };
    }

    return NextResponse.json({
      status: 'success',
      proposal
    });

  } catch (error: any) {
    console.error("AI Forecast Error:", error.message);
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 });
  }
}