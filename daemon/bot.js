import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return sum / period;
}

function calculateStandardDeviation(prices, period, sma) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const squaredDifferences = slice.map(price => Math.pow(price - sma, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / period;
    return Math.sqrt(variance);
}

function calculateBollingerBands(prices, period = 20, multiplier = 2.0) {
    const sma = calculateSMA(prices, period);
    if (sma === null) return null;
    const stdDev = calculateStandardDeviation(prices, period, sma);
    if (stdDev === null) return null;
    return {
        sma,
        upperBand: sma + (stdDev * multiplier),
        lowerBand: sma - (stdDev * multiplier)
    };
}

let historicalPrices = [];

async function fetchLiveMarketData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/worldcoin-wld/ohlc?vs_currency=usd&days=1');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const recentCandles = data.slice(-20);
        historicalPrices = recentCandles.map(candle => parseFloat(candle[4]));

        return historicalPrices[historicalPrices.length - 1];
    } catch (error) {
        console.error("⚠️ Error fetching live WLD price from CoinGecko:", error.message);
        return null;
    }
}

async function runMarketAnalysis() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🤖 WLDguard Daemon Waking Up...`);
    
    const livePrice = await fetchLiveMarketData();

    if (!livePrice || historicalPrices.length < 20) {
        console.log("⏳ Waiting for sufficient market data...");
        return;
    }
    
    console.log(`📊 Live WLD Price: $${livePrice.toFixed(3)}`);

    const bands = calculateBollingerBands(historicalPrices, 20, 2.0);
    if (!bands) return;

    console.log(`📈 Upper Band: $${bands.upperBand.toFixed(3)} | 📉 Lower Band: $${bands.lowerBand.toFixed(3)}`);

    let action = 'HOLD';
    let description = '';
    let expectedYield = '';

    if (livePrice > bands.upperBand) {
        action = 'TRIM_WLD';
        description = `Market Overbought at $${livePrice.toFixed(3)}. Trimming 40% WLD into USDC to lock in profits.`;
        expectedYield = '13.34% APY (USDC Vault)';
        console.log(`🚨 [SIGNAL] WLD is OVERBOUGHT! Preparing Database Broadcast...`);
    } else if (livePrice < bands.lowerBand) {
        action = 'BUY_WLD';
        description = `Market Oversold at $${livePrice.toFixed(3)}. Buying WLD with parked USDC.`;
        expectedYield = '13.57% APY (WLD Vault)';
        console.log(`🚨 [SIGNAL] WLD is OVERSOLD! Preparing Database Broadcast...`);
    } else {
        action = 'HOLD';
        description = `Market is Stable at $${livePrice.toFixed(3)}. Let your assets continue earning passive vault yield.`;
        expectedYield = '13.57% APY (WLD Vault)';
        console.log(`🛡️ Market is Stable at $${livePrice.toFixed(3)}. Preparing Database Broadcast for Dashboard...`);
        // 🚨 CRITICAL FIX: The "return;" has been removed from here so it ACTUALLY writes to the DB!
    }

    try {
        let users = await prisma.user.findMany();
        
        if (users.length === 0) {
            console.log("⚠️ No users found. Creating 'Beta Tester' profile for Closed Beta...");
            const testUser = await prisma.user.create({
                data: {
                    worldId: "beta_tester_001",
                    walletAddress: "0xBetaWallet",
                    wldBalance: 100,
                    usdcBalance: 0
                }
            });
            users = [testUser]; 
        }

        console.log(`📡 Broadcasting signal to ${users.length} active users...`);
        
        for (const user of users) {
            await prisma.proposal.create({
                data: {
                    userId: user.id,
                    type: action,
                    description: description,
                    expectedYield: expectedYield,
                    status: 'PENDING_USER_APPROVAL'
                }
            });
        }
        console.log(`✅ Success! The Frontend UI will now show the '$${livePrice.toFixed(3)}' price.`);
    } catch (error) {
        console.log(`⚠️ Database connection skipped for local testing:`, error.message);
    }
}

console.log("=============================================");
console.log("🚀 Starting WLDguard 24/7 Quant Engine (CoinGecko Live API)...");
console.log("=============================================");

runMarketAnalysis();

// 5 minutes (300000 milliseconds)
setInterval(runMarketAnalysis, 300000);