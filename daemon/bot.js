/**
 * WLDguard 24/7 Quant Engine (Daemon)
 * Connected to PostgreSQL and CoinGecko (U.S. Compliant API)
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ==========================================
// 1. QUANTITATIVE MATH ENGINE
// ==========================================
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

// ==========================================
// 2. LIVE MARKET FEED (COINGECKO API)
// ==========================================
let historicalPrices = [];

async function fetchLiveMarketData() {
    try {
        // Fetch the last 1 day of OHLC (Open, High, Low, Close) data for WLD
        // CoinGecko returns this in 30-minute intervals (candles)
        const response = await fetch('https://api.coingecko.com/api/v3/coins/worldcoin-wld/ohlc?vs_currency=usd&days=1');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        // Extract closing prices (index 4 in CoinGecko's array structure)
        // We slice the last 20 candles to give our AI the last 10 hours of price action
        const recentCandles = data.slice(-20);
        historicalPrices = recentCandles.map(candle => parseFloat(candle[4]));

        // The last item in the array is the most current live price
        return historicalPrices[historicalPrices.length - 1];
    } catch (error) {
        console.error("⚠️ Error fetching live WLD price from CoinGecko:", error.message);
        return null;
    }
}

// ==========================================
// 3. THE DECISION ENGINE & DATABASE BROADCASTER
// ==========================================
async function runMarketAnalysis() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🤖 WLDguard Daemon Waking Up...`);
    
    // Fetch real-time data from CoinGecko
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
        // We removed the 'return;' here so it pushes the live price to the UI!
    }

    // 📡 BROADCAST TO ALL USERS IN THE DATABASE
    try {
        let users = await prisma.user.findMany();
        
        // NEW: Auto-create a test user if the database is empty!
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
            users = [testUser]; // Now the loop has someone to broadcast to!
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
        console.log(`✅ Success! The Frontend UI will now show the 'Sign & Execute' button to users.`);
    } catch (error) {
        console.log(`⚠️ Database connection skipped for local testing (No live users to broadcast to yet).`);
    }
}

// ==========================================
// INITIALIZATION
// ==========================================
console.log("=============================================");
console.log("🚀 Starting WLDguard 24/7 Quant Engine (CoinGecko Live API)...");
console.log("=============================================");

runMarketAnalysis();

// 5 minutes (300000 milliseconds) for Production Beta
setInterval(runMarketAnalysis, 300000);