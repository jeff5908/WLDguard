import { PrismaClient } from '@prisma/client';
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

// --- Morpho Yield API ---
async function fetchMorphoYield(vaultAddress, chainId) {
    try {
        const query = `
            query {
                vaultByAddress(address: "${vaultAddress}", chainId: ${chainId}) {
                    state {
                        netApy
                    }
                }
            }
        `;
        const response = await fetch('https://blue-api.morpho.org/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        const rawApy = data?.data?.vaultByAddress?.state?.netApy;
        
        // Morpho returns decimals (e.g., 0.1288). We convert it to a percentage (12.88).
        if (rawApy !== undefined && rawApy !== null) {
            return (rawApy * 100).toFixed(2); 
        }
        return null;
    } catch (error) {
        console.log(`⚠️ Error fetching Morpho API for ${vaultAddress}:`, error.message);
        return null;
    }
}

// --- Live Market API ---
async function fetchLiveMarketData() {
    try {
        // Swapped to MEXC Public API: Identical structure to Binance, but U.S. IP friendly for read-only data
        const response = await fetch('https://api.mexc.com/api/v3/klines?symbol=WLDUSDT&interval=60m&limit=20');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        // MEXC returns an array of arrays. Index 4 is the closing price.
        historicalPrices = data.map(candle => parseFloat(candle[4]));

        return historicalPrices[historicalPrices.length - 1];
    } catch (error) {
        console.error("⚠️ Error fetching live WLD price:", error.message);
        return null;
    }
}

const MORPHO_WLD_VAULT = "0xc3d68deB631FA5896E3a3e6B4e3b1c676E4B490B";
const MORPHO_USDC_VAULT = "0x5403063cbce1df2f61e8787f0a8d56b4bd4b1239";

// --- The Core Bot Loop ---
async function runMarketAnalysis() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🤖 WLDguard Daemon Waking Up...`);
    
    const livePrice = await fetchLiveMarketData();

    if (!livePrice || historicalPrices.length < 20) {
        console.log("⏳ Waiting for sufficient market data...");
        return;
    }
    
    console.log(`📊 Live WLD Price: $${livePrice.toFixed(3)}`);

    // Fetch live yields (with our hardcoded fallbacks just in case the API drops)
    const wldApy = await fetchMorphoYield(MORPHO_WLD_VAULT, 480) || "12.88";
    const usdcApy = await fetchMorphoYield(MORPHO_USDC_VAULT, 480) || "12.24";
    
    console.log(`🌱 Live APY - WLD: ${wldApy}% | USDC: ${usdcApy}%`);

    const bands = calculateBollingerBands(historicalPrices, 20, 2.0);
    if (!bands) return;

    console.log(`📈 Upper Band: $${bands.upperBand.toFixed(3)} | 📉 Lower Band: $${bands.lowerBand.toFixed(3)}`);

    let action = 'HOLD';
    let description = `Market is Stable at $${livePrice.toFixed(3)}. Let your assets continue earning passive vault yield.`;
    // Dynamically inject the live APY into the database proposal
    let expectedYield = `${wldApy}% APY (WLD Vault)`;

    if (livePrice > bands.upperBand) {
        action = 'TRIM_WLD';
        description = `Market Overbought at $${livePrice.toFixed(3)}. Trimming WLD into USDC to lock in profits.`;
        expectedYield = `${usdcApy}% APY (USDC Vault)`;
        console.log(`🚨 [SIGNAL] WLD is OVERBOUGHT! Preparing Database Broadcast...`);
    } else if (livePrice < bands.lowerBand) {
        action = 'BUY_WLD';
        description = `Market Oversold at $${livePrice.toFixed(3)}. Buying WLD with parked USDC.`;
        expectedYield = `${wldApy}% APY (WLD Vault)`;
        console.log(`🚨 [SIGNAL] WLD is OVERSOLD! Preparing Database Broadcast...`);
    } else {
        console.log(`🛡️ Market is Stable. No trade required.`);
    }

    // --- Resilient Database Connection (Retry Logic for Neon Cold Starts) ---
    let retries = 3;
    while (retries > 0) {
        try {
            // Find our active beta tester
            const users = await prisma.user.findMany();
            
            if (users.length > 0) {
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
                console.log(`✅ Success! Database updated.`);
            } else {
                console.log(`⚠️ No users found in database to broadcast to.`);
            }
            break; // Success! Exit the retry loop
        } catch (error) {
            retries -= 1;
            console.log(`⚠️ Database asleep. Retrying in 3 seconds... (${retries} attempts left)`);
            if (retries === 0) {
                console.log(`❌ Database connection failed after retries:`, error.message);
            } else {
                // Wait 3 seconds for Neon to wake up before trying again
                await new Promise(res => setTimeout(res, 3000));
            }
        }
    }
}

console.log("=============================================");
console.log("🚀 Starting WLDguard 24/7 Quant Engine...");
console.log("=============================================");

// Run immediately on startup
runMarketAnalysis();

// Then run every 5 minutes (300,000 milliseconds)
setInterval(runMarketAnalysis, 300000);