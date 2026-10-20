"use client";
import { MiniKit } from "@worldcoin/minikit-js";
import { useState } from "react";

export default function Home() {
  const [signature, setSignature] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string>("Ready. Press activate to sign.");

  const liquidBalance = 142.8; 
  const amountToProtect = liquidBalance * 0.5;
  const bollingerTargetPrice = 2.45;
  
  const signAlphaIntent = async () => {
    setDebugLog("Requesting Alpha Strategy authorization...");

    try {
      const intentString = 
`WLDGUARD LIMIT ORDER
--------------------
Action: Sell ${amountToProtect.toFixed(2)} WLD for USDC
Target Price: >= $${bollingerTargetPrice}
Treasury: 0x5b9ADA2755Db4B89545Ac072d3Eaa848fB8B365C
Expiration: 7 Days`;

      const response = await MiniKit.signMessage({ message: intentString });

      if (response?.data?.status === "success") {
        const capturedSig = response.data.signature;
        setSignature(capturedSig);
        setDebugLog("Signature captured! Sending to Neon database...");

        try {
          const apiRes = await fetch('/api/save-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              intent_action: `Sell ${amountToProtect.toFixed(2)} WLD at $${bollingerTargetPrice}`,
              signature: capturedSig
            })
          });
          
          const dbResult = await apiRes.json();
          
          if (dbResult.success) {
            setDebugLog("Database write complete! Strategy active.");
          } else {
            setDebugLog("DB Error: " + dbResult.error);
          }
        } catch (dbErr: unknown) {
          const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
          setDebugLog("Fetch Error: " + msg);
        }
      } else {
        setDebugLog("Wallet rejected: " + JSON.stringify(response));
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setDebugLog("Crash: " + msg);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="bg-white p-6 rounded-3xl shadow-md w-full max-w-md">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">WLDguard</h1>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
            +42.8% vs Hold
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Alpha Strategy Proposed</p>
          <h2 className="text-lg font-semibold text-black mb-2">
            Secure {amountToProtect.toFixed(2)} WLD at Upper Band
          </h2>
          <p className="text-sm text-gray-600">
            The quant engine has detected a potential overbought signal. Delegating this limit order allows the AI to automatically route your WLD to USDC if the price hits <strong>${bollingerTargetPrice}</strong>.
          </p>
        </div>
        
        <button 
          onClick={signAlphaIntent}
          className="w-full bg-black text-white px-6 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors"
        >
          Activate Alpha Strategy
        </button>

        <div className="mt-6 p-3 bg-gray-100 rounded-lg text-xs text-left text-gray-700 font-mono break-words">
          <span className="font-bold block mb-1 text-black">System Log:</span>
          <br/>
          {debugLog}
        </div>

        {signature && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm">
            <p className="text-sm text-green-800 font-bold mb-1">Strategy Activated!</p>
            <p className="text-xs text-green-700 mb-2">Your target is locked. WLDguard is monitoring the market.</p>
            <p className="text-[10px] text-green-600 break-all opacity-75">{signature.slice(0, 45)}...</p>
          </div>
        )}
      </div>
    </main>
  );
}
