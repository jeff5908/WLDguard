import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Fetch the LIVE WLD price directly from the market
    const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=WLDUSDT');
    const priceData = await priceRes.json();
    const livePrice = parseFloat(priceData.price).toFixed(3);

    // We return HOLD so the frontend knows to trigger the 0.5 WLD Morpho deposit test
    return NextResponse.json({
      status: 'success',
      signal: 'HOLD', 
      price: livePrice
    });
  } catch (error) {
    console.error("Price fetch failed", error);
    return NextResponse.json({
      status: 'error',
      signal: 'HOLD',
      price: '0.000'
    });
  }
}