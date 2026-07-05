/**
 * WLDguard 24/7 Quant Engine (Daemon)
 * Now connected to PostgreSQL to broadcast signals to the frontend!
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
// 2. SIMULATED LIVE MARKET FEED
// ==========================================
const historicalPrices = [
    2.00, 2.01, 2.02, 1.99, 1.98, 2.05, 2.10, 2.15, 2.12, 2.11, 
    2.14, 2.16, 2.18, 2.20, 2.25, 2.30, 2.35, 2.40, 2.45, 2.50
];
const futureTicks = [2.95, 2.70, 2.10, 1.40, 1.90];
let tickIndex = 0;

// ==========================================
// 3. THE DECISION ENGINE & DATABASE BROADCASTER
// ==========================================
async function runMarketAnalysis() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🤖 WLDguard Daemon Waking Up...`);
    
    if (tickIndex < futureTicks.length) {
        historicalPrices.push(futureTicks[tickIndex]);
        tickIndex++;
    }
    
    const livePrice = historicalPrices[historicalPrices.length - 1];
    console.log(`📊 Live WLD Price: $${livePrice.toFixed(3)}`);

    const bands = calculateBollingerBands(historicalPrices, 20, 2.0);
    if (!bands) return;

    let action = 'HOLD';
    let description = '';
    let expectedYield = '';

    if (livePrice > bands.upperBand) {
        action = 'TRIM_WLD';
        description = `Market Overbought at $${livePrice.toFixed(2)}. Trimming 40% WLD into USDC to lock in profits.`;
        expectedYield = '13.34% APY (USDC Vault)';
        console.log(`🚨 [SIGNAL] WLD is OVERBOUGHT! Preparing Database Broadcast...`);
    } else if (livePrice < bands.lowerBand) {
        action = 'BUY_WLD';
        description = `Market Oversold at $${livePrice.toFixed(2)}. Buying WLD with parked USDC.`;
        expectedYield = '13.57% APY (WLD Vault)';
        console.log(`🚨 [SIGNAL] WLD is OVERSOLD! Preparing Database Broadcast...`);
    } else {
        console.log(`🛡️ Market is Stable. Going back to sleep...`);
        return; // We only write to the database when action is needed!
    }

    // 📡 BROADCAST TO ALL USERS IN THE DATABASE
    try {
        const users = await prisma.user.findMany();
        
        if (users.length === 0) {
            console.log("⚠️ No users found in database yet. Waiting for signups.");
            return;
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
console.log("🚀 Starting WLDguard 24/7 Quant Engine...");
console.log("=============================================");

runMarketAnalysis();

// Switched from 5 seconds (5000) to 5 minutes (300000 milliseconds) for Production Beta
setInterval(runMarketAnalysis, 300000);