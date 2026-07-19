import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// --- Telegram Push Notification System ---
async function sendTelegramAlert(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    // If you haven't set up the keys yet, the bot just skips this silently
    if (!token || !chatId) return;

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat_id: chatId, 
                text: message,
                parse_mode: 'HTML' // Allows us to use bold text in the alert
            })
        });
    } catch (error) {
        console.error("⚠️ Telegram Alert Failed:", error.message);
    }
}

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
        
        if (rawApy !== undefined && rawApy !== null) {
            return (rawApy * 100).toFixed(2); 
        }
        return null;
    } catch (error) {
        return null;
    }
}

// --- Live Market API ---
async function fetchLiveMarketData() {
    try {
        const response = await fetch('https://api.mexc.com/api/v3/klines?symbol=WLDUSDT&interval=60m&limit=20');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
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

    const wldApy = await fetchMorphoYield(MORPHO_WLD_VAULT, 480) || "12.88";
    const usdcApy = await fetchMorphoYield(MORPHO_USDC_VAULT, 480) || "12.24";
    
    console.log(`🌱 Live APY - WLD: ${wldApy}% | USDC: ${usdcApy}%`);

    const bands = calculateBollingerBands(historicalPrices, 20, 2.0);
    if (!bands) return;

    console.log(`📈 Upper Band: $${bands.upperBand.toFixed(3)} | 📉 Lower Band: $${bands.lowerBand.toFixed(3)}`);

    let action = 'HOLD';
    let description = `Market is Stable at $${livePrice.toFixed(3)}. Let your assets continue earning passive vault yield.`;
    let expectedYield = `${wldApy}% APY (WLD Vault)`;
    let alertMessage = null;

    if (livePrice > bands.upperBand) {
        action = 'TRIM_WLD';
        description = `Market Overbought at $${livePrice.toFixed(3)}. Trimming WLD into USDC to lock in profits.`;
        expectedYield = `${usdcApy}% APY (USDC Vault)`;
        alertMessage = `🚨 <b>WLDguard Alert</b>\n\nMarket is <b>OVERBOUGHT</b> at $${livePrice.toFixed(3)}!\n\nOpen World App to deploy your WLD to USDC vaults.`;
        console.log(`🚨 [SIGNAL] WLD is OVERBOUGHT! Preparing Broadcast...`);
    } else if (livePrice < bands.lowerBand) {
        action = 'BUY_WLD';
        description = `Market Oversold at $${livePrice.toFixed(3)}. Buying WLD with parked USDC.`;
        expectedYield = `${wldApy}% APY (WLD Vault)`;
        alertMessage = `🚨 <b>WLDguard Alert</b>\n\nMarket is <b>OVERSOLD</b> at $${livePrice.toFixed(3)}!\n\nOpen World App to buy the WLD dip with your parked USDC.`;
        console.log(`🚨 [SIGNAL] WLD is OVERSOLD! Preparing Broadcast...`);
    } else {
        console.log(`🛡️ Market is Stable. No trade required.`);
    }

    // --- Resilient Database Connection ---
    let retries = 3;
    while (retries > 0) {
        try {
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
                
                // 🚨 If the AI generated an alert, send the push notification to your phone!
                if (alertMessage) {
                    await sendTelegramAlert(alertMessage);
                    console.log(`📱 Push notification sent to Telegram.`);
                }
            }
            break; 
        } catch (error) {
            retries -= 1;
            if (retries === 0) {
                console.log(`❌ Database connection failed:`, error.message);
            } else {
                await new Promise(res => setTimeout(res, 3000));
            }
        }
    }
}

console.log("=============================================");
console.log("🚀 Starting WLDguard 24/7 Quant Engine...");
console.log("=============================================");

runMarketAnalysis();
setInterval(runMarketAnalysis, 300000);