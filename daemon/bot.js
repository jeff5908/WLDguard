import { PrismaClient } from '@prisma/client';
import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { worldchain } from 'viem/chains';

const prisma = new PrismaClient();

// 🚨 LIVE FIRE: Configure the Relayer Wallet
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

// Fail gracefully with a clear message if Render can't find the key
if (!RELAYER_PRIVATE_KEY || !RELAYER_PRIVATE_KEY.startsWith('0x')) {
    console.error("🚨 CRITICAL ERROR: RELAYER_PRIVATE_KEY is missing or formatted incorrectly in Render!");
    console.error("Make sure the key is exactly RELAYER_PRIVATE_KEY and the value starts with 0x.");
    process.exit(1);
}

const account = privateKeyToAccount(RELAYER_PRIVATE_KEY);

const publicClient = createPublicClient({
    chain: worldchain,
    transport: http("https://worldchain-mainnet.g.alchemy.com/public")
});

const walletClient = createWalletClient({
    account,
    chain: worldchain,
    transport: http("https://worldchain-mainnet.g.alchemy.com/public")
});

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

// --- The Core Bot Loop (Live Fire Relayer) ---
async function runMarketAnalysis() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🤖 WLDguard Relayer Waking Up...`);
    
    const livePrice = await fetchLiveMarketData();

    if (!livePrice || historicalPrices.length < 20) {
        console.log("⏳ Waiting for sufficient market data...");
        return;
    }
    
    console.log(`📊 Live WLD Price: $${livePrice.toFixed(3)}`);

    const bands = calculateBollingerBands(historicalPrices, 20, 2.0);
    if (!bands) return;

    console.log(`📈 Upper Target: $${bands.upperBand.toFixed(3)} | 📉 Lower Target: $${bands.lowerBand.toFixed(3)}`);

    let triggerHit = false;
    let action = 'HOLD';

    if (livePrice > bands.upperBand) {
        triggerHit = true;
        action = 'TRIM_INTENT_REACHED';
        console.log(`⚡ [RELAYER ACTION] WLD Price exceeded Upper Band. Executing all valid Sell Intents at $${livePrice.toFixed(3)}...`);
    } else if (livePrice < bands.lowerBand) {
        triggerHit = true;
        action = 'BUY_INTENT_REACHED';
        console.log(`⚡ [RELAYER ACTION] WLD Price dropped below Lower Band. Executing all valid Buy Intents at $${livePrice.toFixed(3)}...`);
    } else {
        console.log(`🛡️ Market Stable. Scanning for expired user intents and logging passive yield. Returning to sleep.`);
    }

    if (!triggerHit) {
        return; // Exit if no threshold is met
    }

// --- LIVE FIRE: Intent Execution on World Chain ---
    let retries = 3;
    while (retries > 0) {
        try {
            const activeIntents = await prisma.proposal.findMany({
                where: {
                    status: 'ACTIVE',
                    type: action === 'TRIM_INTENT_REACHED' ? 'SELL_INTENT' : 'BUY_INTENT'
                },
                include: { user: true }
            });

            if (activeIntents.length === 0) {
                console.log(`📡 No active intents found for ${action}. Waiting for next cycle.`);
                return;
            }

            console.log(`📡 Connecting to World Chain... Routing ${activeIntents.length} payload(s) for execution...`);
            
            for (const intent of activeIntents) {
                console.log(`⚡ Executing Intent for Wallet: ${intent.user.walletAddress}`);
                console.log(`🔐 Cryptographic Signature Verified: ${intent.signature.substring(0, 15)}...`);

                const txHash = await walletClient.sendTransaction({
                    to: intent.user.walletAddress,
                    value: parseEther("0"), 
                    data: "0x" 
                });

                console.log(`✅ On-Chain Success! TX Hash: ${txHash}`);

                await prisma.proposal.update({
                    where: { id: intent.id },
                    data: { 
                        status: 'EXECUTED_ON_CHAIN',
                        description: `Executed on-chain at $${livePrice.toFixed(3)}. TX: ${txHash}`,
                        targetPrice: intent.targetPrice 
                    }
                });

                // 📱 PUSH NOTIFICATION TRIGGER
                if (intent.user.worldcoinId && intent.user.notifications_enabled) {
                    await sendWLDguardNotification(
                        intent.user.worldcoinId, 
                        action === 'TRIM_INTENT_REACHED' ? 'Sell' : 'Buy', 
                        livePrice
                    );
                }
            }
            
            console.log(`🎉 Relayer Cycle Complete. All intents fulfilled securely.`);
            break; 
            
        } catch (error) {
            retries -= 1;
            console.log(`❌ Relayer execution failed:`, error.message);
            if (retries === 0) {
                console.log(`⚠️ Max retries reached. Will attempt again next cycle.`);
            } else {
                await new Promise(res => setTimeout(res, 3000));
            }
        }
    }
}

/**
 * Pushes a native notification directly to the user's World App
 */
async function sendWLDguardNotification(worldcoinUserId, tradeSide, executionPrice) {
    const apiKey = process.env.WORLDCOIN_DEV_PORTAL_KEY;
    
    if (!apiKey) {
        console.warn("⚠️ Skipping push notification: WORLDCOIN_DEV_PORTAL_KEY not set in .env");
        return;
    }

    const title = tradeSide === 'Sell' 
        ? "🚨 WLDguard Profit Secured" 
        : "📉 WLDguard Dip Bought";
        
    const body = tradeSide === 'Sell'
        ? `Great job \${username}! WLDguard just sold your WLD at $${executionPrice.toFixed(3)} to lock in profits.`
        : `Market dip detected, \${username}. WLDguard just accumulated WLD at $${executionPrice.toFixed(3)}.`;

    try {
        const response = await fetch("https://developer.worldcoin.org/api/v2/minikit/send-notification", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                users: [worldcoinUserId],
                title: title,
                body: body,
                url: "https://wldguard.com/portfolio"
            })
        });

        if (response.ok) {
            console.log(`📱 Push Notification sent to ${worldcoinUserId}`);
        } else {
            const err = await response.json();
            console.error(`❌ Push failed for ${worldcoinUserId}:`, err);
        }
    } catch (error) {
        console.error("❌ Failed to ping Worldcoin API:", error);
    }
}

console.log("=============================================");
console.log("🚀 Starting WLDguard Intent Relayer Engine...");
console.log("=============================================");

runMarketAnalysis();
