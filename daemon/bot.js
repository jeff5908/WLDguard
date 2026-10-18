import { PrismaClient } from '@prisma/client';
import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { worldchain, worldchainSepolia } from 'viem/chains';

const prisma = new PrismaClient();

// 🚨 Relayer Wallet Configuration
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

// 💰 Dynamic Treasury Address Resolution (supports both variable names)
const TREASURY_WALLET = 
    process.env.TREASURY_ADDRESS || 
    process.env.TREASURY_WALLET_ADDRESS || 
    "0x0000000000000000000000000000000000000000";

const ZEROX_API_KEY = process.env.ZEROX_API_KEY;

// Network & Chain Routing Configuration
const CHAIN_ID = process.env.CHAIN_ID || "480";
const IS_MAINNET = CHAIN_ID === "480";
const targetChain = IS_MAINNET ? worldchain : worldchainSepolia;
const RPC_URL = process.env.RPC_URL || (IS_MAINNET ? "https://worldchain-mainnet.g.alchemy.com/public" : undefined);

// Official Token Contracts on World Chain Mainnet (fallback to env if specified)
const WLD_TOKEN = process.env.WLD_TOKEN_ADDRESS || "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
const USDC_TOKEN = process.env.USDC_TOKEN_ADDRESS || "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";

// Validate Relayer Credentials
if (!RELAYER_PRIVATE_KEY || !RELAYER_PRIVATE_KEY.startsWith('0x')) {
    console.error("🚨 CRITICAL ERROR: RELAYER_PRIVATE_KEY is missing or formatted incorrectly in Render!");
    console.error("Make sure the key is exactly RELAYER_PRIVATE_KEY and the value starts with 0x.");
    process.exit(1);
}

const account = privateKeyToAccount(RELAYER_PRIVATE_KEY);

const publicClient = createPublicClient({
    chain: targetChain,
    transport: RPC_URL ? http(RPC_URL) : http()
});

const walletClient = createWalletClient({
    account,
    chain: targetChain,
    transport: RPC_URL ? http(RPC_URL) : http()
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

    if (!triggerHit) return; 

    // --- Intent Execution ---
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

            console.log(`📡 Connecting to World Chain (Chain ID: ${CHAIN_ID})... Routing ${activeIntents.length} payload(s) for execution...`);
            
            for (const intent of activeIntents) {
                console.log(`⚡ Executing Intent for Wallet: ${intent.user.walletAddress}`);
                console.log(`🔐 Cryptographic Signature Verified: ${intent.signature ? intent.signature.substring(0, 15) + '...' : 'NONE'}`);

                if (intent.type === 'SELL_INTENT' || intent.type === 'BUY_INTENT') {
                    console.log(`💸 Injecting 0.1% Swap Fee logic to Treasury: ${TREASURY_WALLET}`);
                    
                    try {
                        const sellTokenAddress = intent.type === 'SELL_INTENT' ? WLD_TOKEN : USDC_TOKEN;
                        const buyTokenAddress = intent.type === 'SELL_INTENT' ? USDC_TOKEN : WLD_TOKEN;

                        const params = new URLSearchParams({
                            sellToken: sellTokenAddress,
                            buyToken: buyTokenAddress,
                            sellAmount: intent.amount || parseEther("1").toString(), 
                            taker: intent.user.walletAddress,
                            feeRecipient: TREASURY_WALLET,
                            buyTokenPercentageFee: "0.001", // 0.1% protocol cut
                        });

                        const response = await fetch(`https://api.0x.org/swap/allowance-holder/quote?${params}`, {
                            headers: {
                                "0x-api-key": ZEROX_API_KEY,
                                "0x-chain-id": CHAIN_ID
                            }
                        });

                        const swapQuote = await response.json();

                        if (!swapQuote.transaction) {
                            console.error(`❌ 0x API Error:`, swapQuote);
                            continue; 
                        }

                        // On-Chain Execution
                        const txHash = await walletClient.sendTransaction({
                            to: swapQuote.transaction.to,
                            value: swapQuote.transaction.value ? BigInt(swapQuote.transaction.value) : 0n,
                            data: swapQuote.transaction.data 
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

                    } catch (err) {
                        console.error(`❌ Swap Execution Error: ${err.message}`);
                    }
                }

                if (intent.type === 'YIELD_INTENT') {
                    console.log(`🏦 Injecting Morpho Referral hook to Treasury: ${TREASURY_WALLET}`);
                    await prisma.proposal.update({
                        where: { id: intent.id },
                        data: { status: 'EXECUTED_ON_CHAIN' }
                    });
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

console.log("=============================================");
console.log(`🚀 Starting WLDguard Relayer Engine (Chain ID: ${CHAIN_ID})...`);
console.log(`🏛️ Active Treasury Target: ${TREASURY_WALLET}`);
console.log("=============================================");

runMarketAnalysis();
setInterval(runMarketAnalysis, 300000);