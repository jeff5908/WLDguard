const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- Quant Math Functions ---
function calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((acc, val) => acc + val, 0) / period;
}

function calculateStandardDeviation(prices, period, sma) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
    return Math.sqrt(variance);
}

function calculateBollingerBands(prices, period = 20, multiplier = 2.0) {
    const sma = calculateSMA(prices, period);
    if (!sma) return null;
    const stdDev = calculateStandardDeviation(prices, period, sma);
    if (!stdDev) return null;
    return {
        sma,
        upperBand: sma + (stdDev * multiplier),
        lowerBand: sma - (stdDev * multiplier)
    };
}

let historicalPrices = [];

// --- Live Market API ---
async function fetchLiveMarketData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/worldcoin-wld/ohlc?vs_currency=usd&days=1');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        // Extract the closing prices from the last 20 candles
        const recentCandles = data.slice(-20);
        historicalPrices = recentCandles.map(candle => parseFloat(candle[4]));

        return historicalPrices[historicalPrices.length - 1];
    } catch (error) {
        console.error("⚠️ Error fetching live WLD price:", error.message);
        return null;
    }
}

// --- The Core Bot Loop ---
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
    let description = `Market is Stable at $${livePrice.toFixed(3)}. Let your assets continue earning passive vault yield.`;
    let expectedYield = '13.57% APY (WLD Vault)';

    if (livePrice > bands.upperBand) {
        action = 'TRIM_WLD';
        description = `Market Overbought at $${livePrice.toFixed(3)}. Trimming WLD into USDC to lock in profits.`;
        expectedYield = '13.34% APY (USDC Vault)';
        console.log(`🚨 [SIGNAL] WLD is OVERBOUGHT! Preparing Database Broadcast...`);
    } else if (livePrice < bands.lowerBand) {
        action = 'BUY_WLD';
        description = `Market Oversold at $${livePrice.toFixed(3)}. Buying WLD with parked USDC.`;
        expectedYield = '13.57% APY (WLD Vault)';
        console.log(`🚨 [SIGNAL] WLD is OVERSOLD! Preparing Database Broadcast...`);
    } else {
        console.log(`🛡️ Market is Stable. No trade required.`);
    }

    try {
        // Find our active beta tester (You!)
        const users = await prisma.user.findMany();
        
        if (users.length > 0) {
            console.log(`📡 Broadcasting signal to ${users.length} active users...`);
            
            for (const user of users) {
                // Save the proposal directly to the database so the phone app can read it
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
            console.log(`✅ Success! Database updated.`);
        } else {
            console.log(`⚠️ No users found in database to broadcast to.`);
        }
    } catch (error) {
        console.log(`⚠️ Database connection error:`, error.message);
    }
}

console.log("=============================================");
console.log("🚀 Starting WLDguard 24/7 Quant Engine...");
console.log("=============================================");

// Run immediately on startup
runMarketAnalysis();

// Then run every 5 minutes (300,000 milliseconds)
setInterval(runMarketAnalysis, 300000);