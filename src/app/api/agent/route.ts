import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 🚨 FIX: Swapped Binance for MEXC to bypass Vercel's US-based IP Geoblocking
    const priceRes = await fetch('https://api.mexc.com/api/v3/ticker/price?symbol=WLDUSDT');
    const priceData = await priceRes.json();
    const livePrice = parseFloat(priceData.price).toFixed(3);

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