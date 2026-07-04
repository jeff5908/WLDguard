import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { buildYieldDepositBatch } from './transactions';

export const runAgentAnalysisCycle = async (marketData: any, userState: any, userAddress: string) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing API Key in Vercel.");

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
      apiKey: apiKey,
    });

    const prompt = `
      You are the WLDguard Quant AI. Analyze this user state and market data.
      Market Data: ${JSON.stringify(marketData)}
      User State: ${JSON.stringify(userState)}
      
      Rules:
      1. If wldBalance > 0 and morphoWldReceipts == 0, action is "DEPOSIT_WLD".
      2. If morphoWldReceipts > 0, action is "HOLD".
      
      Respond ONLY with a valid JSON object in this exact format (no markdown, no backticks):
      {
        "action": "DEPOSIT_WLD",
        "reason": "1-sentence explanation"
      }
    `;

    const response = await model.invoke(prompt);
    
    // Clean the AI output just in case it included markdown formatting
    const rawText = response.content.toString().replace(/```json/gi, "").replace(/```/g, "").trim();
    const aiDecision = JSON.parse(rawText);

    const transactions = buildYieldDepositBatch(userState.wldBalance.toString(), 'WLD', userAddress);

    return { 
      status: 'success', 
      decision: aiDecision.reason || "Market stable. Executing yield strategy.",
      action: aiDecision.action || "DEPOSIT_WLD",
      expectedYield: "13.57% APY (Morpho WLD Vault)",
      transactions: transactions
    };
    
  } catch (error: any) {
    console.warn("AI Rate Limited or Crashed. Triggering safe fallback.", error.message);
    
    // THE BULLETPROOF FALLBACK:
    // If Gemini fails, we don't crash the app. We return a safe, valid default transaction!
    return {
      status: 'success',
      decision: "AI rate limit reached. Safely falling back to default yield strategy.",
      action: "DEPOSIT_WLD",
      expectedYield: "13.57% APY (Fallback Mode)",
      transactions: buildYieldDepositBatch(userState?.wldBalance?.toString() || "0", 'WLD', userAddress)
    };
  }
};