/**
 * It fetches live market data, runs the WLDguard Quant Math, and alerts the database.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 1. Core Quant Math
const calculateSMA = (prices, period) => {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((acc, val) => acc + val, 0) / period;
};

const calculateBollingerBands = (prices, period = 20, multiplier = 2.0) => {
    const sma = calculateSMA(prices, period);
    if (!sma) return null;

    const slice = prices.slice(-period);
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return { sma, upper: sma + (stdDev * multiplier), lower: sma - (stdDev * multiplier) };
};

// Fetch REAL market data from CoinGecko (US-Friendly)
async function fetchRealMarketData() {
    try {
        console.log("📡 Fetching live WLD prices from CoinGecko...");
        const response = await fetch('https://api.coingecko.com/api/v3/coins/worldcoin-wld/market_chart?vs_currency=usd&days=3');
        const data = await response.json();
        
        if (!data.prices) {
            throw new Error("CoinGecko rate limit hit or invalid response.");
        }
        
        const prices = data.prices.map(item => item[1]);
        return prices.slice(-50);
    } catch (error) {
        console.error("❌ Failed to fetch market data:", error.message);
        return null;
    }
}

// NEW: Helper function to push signals to the database
async function pushSignalToDatabase(type, description, expectedYield) {
    try {
        // 1. Ensure we have at least one user to receive the signal
        let users = await prisma.user.findMany();
        if (users.length === 0) {
            console.log("🌱 Creating initial Founder profile in database...");
            const founder = await prisma.user.create({
                data: {
                    worldId: "founder_id_001",
                    walletAddress: "0xYourWalletAddress",
                    wldBalance: 100
                }
            });
            users = [founder];
        }

        console.log(`📦 Pushing "${type}" alert to ${users.length} active user(s) in the database...`);
        
        // 2. Create the Proposal for every user
        for (const user of users) {
            await prisma.proposal.create({
                data: {
                    userId: user.id,
                    type: type,
                    description: description,
                    expectedYield: expectedYield,
                    status: 'PENDING_USER_APPROVAL'
                }
            });
        }
        console.log("✅ Database successfully updated with the latest AI Signal!");
    } catch (error) {
        console.error("❌ Database push failed:", error.message);
    }
}

// 2. The Main Execution Loop
async function runMarketAnalysis() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🤖 WLDguard Daemon Waking Up...`);
    
    const priceHistory = await fetchRealMarketData();
    if (!priceHistory) return;

    const livePrice = priceHistory[priceHistory.length - 1];
    console.log(`📊 Live WLD Price: $${livePrice.toFixed(3)}`);

    // We use a tight multiplier to find the bands
    const bands = calculateBollingerBands(priceHistory, 20, 2.0);
    
    if (!bands) {
        console.log("⏳ Not enough historical data to generate bands yet.");
        return;
    }

    console.log(`📈 Upper Band: $${bands.upper.toFixed(3)} | 📉 Lower Band: $${bands.lower.toFixed(3)}`);

    // Step C: The Decision Engine (Connected to DB!)
    if (livePrice > bands.upper) {
        console.log(`🚨 SIGNAL TRIGGERED: WLD is OVERBOUGHT!`);
        await pushSignalToDatabase(
            'TRIM_WLD', 
            `AI technical analysis indicates WLD is currently overbought at $${livePrice.toFixed(3)}. Trim 40% into USDC to lock in profit and earn stable yield.`, 
            '13.34% APY (USDC)'
        );
    } else if (livePrice < bands.lower) {
        console.log(`🚨 SIGNAL TRIGGERED: WLD is OVERSOLD!`);
        await pushSignalToDatabase(
            'BUY_WLD', 
            `AI technical analysis indicates WLD is oversold at $${livePrice.toFixed(3)}. Deploy USDC to accumulate WLD at a heavy discount.`, 
            '13.57% APY (WLD)'
        );
    } else {
        console.log(`🛡️ Market is Stable (Within Bands). Holding positions and farming yield.`);
    }
}

// 3. Start the Daemon
console.log("🚀 Starting WLDguard 24/7 Quant Engine (LIVE DATA & DATABASE MODE)...");

runMarketAnalysis();
setInterval(runMarketAnalysis, 5 * 60 * 1000);