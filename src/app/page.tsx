'use client';
import React, { useState, useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [status, setStatus] = useState("System Ready. Awaiting user action.");

  useEffect(() => {
    setIsMounted(true);
    try {
      // 🚨 ADD YOUR APP ID HERE
      MiniKit.install('app_dedd1afaa8a8e8f839438c78814b996f');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleExecute = async () => {
    setStatus("Requesting native drawer & simulating...");

    // We fallback to Vitalik's public address for this 1 wei test!
    const targetAddress = MiniKit.walletAddress || '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

    try {
      // We await the FULL transaction response
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{
          address: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003', // Official WLD Token on World Chain
          abi: [{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
          functionName: 'transfer',
          // Transfer 1 wei to the target address
          args: [targetAddress, '1']
        }],
        reference: `wldguard-beta-${Date.now()}` // Unique ID so it doesn't get cached
      });
      
      // Explicitly check what the hardware's simulation decided
      if (finalPayload.status === 'error') {
        setStatus(`Simulation Failed: ${JSON.stringify(finalPayload)}`);
      } else {
        setStatus("Success! Hardware accepted and executed the payload.");
      }
      
    } catch (e: any) {
      setStatus("Execution Exception: " + e.message);
    }
  };

  // Safe mounting to prevent Vercel crashes
  if (!isMounted) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
       <h1 className="text-3xl font-bold mb-4 text-blue-500">WLDguard Beta</h1>
       
       <div className="bg-black border border-slate-800 p-4 rounded-xl mb-6">
         <p className="text-sm font-mono text-emerald-400 break-words">{status}</p>
       </div>

       <button onClick={handleExecute} className="bg-blue-600 hover:bg-blue-500 p-4 rounded-xl w-full font-bold shadow-lg transition-all active:scale-95">
         Sign & Execute
       </button>
    </main>
  );
}