'use client';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MiniKit } from '@worldcoin/minikit-js';

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState({ users: 1, wld: 100 });
  const [activeTab, setActiveTab] = useState('agent');
  const [loading, setLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    MiniKit.install('app_dedd1afaa8a8e8f839438c78814b996f');
  }, []);

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [{
          address: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
          abi: [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
          functionName: 'approve',
          args: ['0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E', '1000000']
        }],
        reference: `tx-${Date.now()}`
      });
      setTxHash("Success!");
    } catch (e) {
      setErrorMsg("Transaction failed.");
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
       <h1 className="text-3xl font-bold mb-4">WLDguard Dashboard</h1>
       {errorMsg && <div className="bg-red-900 p-4 rounded-xl mb-4">{errorMsg}</div>}
       <button onClick={handleExecute} className="bg-emerald-600 p-4 rounded-xl w-full">
         {isExecuting ? 'Processing...' : 'Sign & Execute'}
       </button>
    </main>
  );
}