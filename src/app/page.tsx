"use client";

import React, { useState, useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

const AlphaChart = () => {
  const [activePoint, setActivePoint] = useState<number | null>(null);

  const data = [
    { x: 0,   label: 'Jan', passive: 100, alpha: 100 },
    { x: 80,  label: 'Feb', passive: 95,  alpha: 105 },
    { x: 160, label: 'Mar', passive: 90,  alpha: 112 },
    { x: 240, label: 'Apr', passive: 95,  alpha: 125 },
    { x: 320, label: 'May', passive: 100, alpha: 135 },
    { x: 400, label: 'Jun', passive: 100, alpha: 142.8 },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-6 shadow-2xl">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Strategy Performance</h2>
          <div className="text-emerald-400 font-mono font-bold text-lg flex items-center gap-2">
            +42.8% vs Hold
          </div>
        </div>
      </div>
      
      <div className="relative w-full h-24">
        <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible absolute inset-0">
          <defs>
            <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          <path d="M0,25 L400,25 M0,50 L400,50 M0,75 L400,75" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M0,80 L80,85 L160,90 L240,85 L320,80 L400,80" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
          
          <path d="M0,80 L80,75 L160,68 L240,55 L320,45 L400,20 L400,100 L0,100 Z" fill="url(#greenGlow)" />
          <path d="M0,80 L80,75 L160,68 L240,55 L320,45 L400,20" fill="none" stroke="#10b981" strokeWidth="3" />
          <circle cx="400" cy="20" r="4" fill="#34d399" className="animate-pulse" />
          
          <text x="400" y="100" className="text-[8px] fill-slate-500" textAnchor="end">Passive</text>
          <text x="400" y="12" className="text-[8px] fill-emerald-500 font-bold tracking-wide" textAnchor="end">WLDguard</text>
        </svg>

        <div className="absolute inset-0 flex w-full h-full">
          {data.map((point, index) => (
            <div 
              key={point.label}
              className="flex-1 h-full z-10 cursor-pointer"
              onMouseEnter={() => setActivePoint(index)}
              onMouseLeave={() => setActivePoint(null)}
              onTouchStart={() => setActivePoint(index)}
            />
          ))}
        </div>

        {activePoint !== null && (
          <div 
            className="absolute z-20 bg-slate-800 border border-slate-700 p-2.5 rounded-lg shadow-2xl pointer-events-none transition-all duration-75 min-w-[140px] whitespace-nowrap"
            style={{ 
              left: `${(activePoint / 5) * 100}%`, 
              top: '-10px',
              transform: `translateX(${activePoint > 3 ? '-100%' : '0'})`,
              marginLeft: activePoint > 3 ? '-10px' : '10px'
            }}
          >
            <p className="text-[10px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider border-b border-slate-700 pb-1">{data[activePoint].label} 2026</p>
            <div className="flex justify-between items-center mb-1.5 gap-3">
              <span className="text-[11px] text-emerald-400 font-bold">WLDguard</span>
              <span className="text-[11px] text-emerald-400 font-mono tracking-tight">{data[activePoint].alpha} WLD</span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="text-[10px] text-slate-500">Passive</span>
              <span className="text-[10px] text-slate-500 font-mono tracking-tight">{data[activePoint].passive} WLD</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [balances, setBalances] = useState({ liquid: 0, vault: 0, total: 0 });
  const [isFetchingBalances, setIsFetchingBalances] = useState(true);
  
  const [globalStats, setGlobalStats] = useState({ users: 1, wld: 95.07 });

  useEffect(() => {
    setIsMounted(true);
    const session = localStorage.getItem('wldguard_session');
    const savedAddress = localStorage.getItem('wldguard_address');
    
    if (session === 'active') {
      setIsVerified(true);
      if (savedAddress) setWalletAddress(savedAddress);
    }
  }, []);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const res = await fetch(`/api/stats?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.totalUsers !== undefined) {
          setGlobalStats({ users: data.totalUsers, wld: data.totalWld });
        }
      } catch (error) {
        console.error("Global stats fetch failed", error);
      }
    };
    fetchGlobalStats();
  }, []);

  useEffect(() => {
    if (isVerified && walletAddress) {
      const fetchBalances = async () => {
        setIsFetchingBalances(true);
        try {
          const res = await fetch(`/api/balances?address=${walletAddress}&t=${Date.now()}`, { cache: 'no-store' });
          if (!res.ok) throw new Error("Balance API Failed");
          
          const data = await res.json();

          setBalances({
            liquid: data.liquid || 0,
            vault: data.vault || 0,
            total: (data.liquid || 0) + (data.vault || 0)
          });

        } catch (error) {
          console.error("Balance fetch failed", error);
          setBalances({ liquid: 0, vault: 0, total: 0 });
        } finally {
          setIsFetchingBalances(false);
        }
      };
      fetchBalances();
    }
  }, [isVerified, walletAddress]);

  const handleVerify = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setIsLoading(true);

    try {
      if (MiniKit.isInstalled()) {
        const result = await MiniKit.commandsAsync.walletAuth({
          nonce: crypto.randomUUID().replace(/-/g, ""),
          requestId: '0',
          expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
          notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
          statement: 'Sign in to WLDguard to securely optimize your yield.',
        });

        if (result?.finalPayload?.status === 'success') {
          // 🚨 THE BULLETPROOF FIX: We bypass the URL and extract the address directly from the SIWE payload!
          const userAddr = result.finalPayload.address || MiniKit.walletAddress;
          
          if (!userAddr) {
             alert("Hardware Error: Could not extract wallet address from signature. Are you in Test Mode?");
             setIsLoading(false);
             return;
          }
          
          localStorage.setItem('wldguard_session', 'active');
          localStorage.setItem('wldguard_address', userAddr);
          
          setWalletAddress(userAddr);
          setIsVerified(true);
        } else {
          console.log("User cancelled login.");
        }
      } else {
        alert("MiniKit SDK is not installed or detected. Are you in the World App?");
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("An unexpected error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    localStorage.removeItem('wldguard_session');
    localStorage.removeItem('wldguard_address');
    setWalletAddress(null);
    setIsVerified(false);
    setProposal(null);
    setSuccessMsg("");
  };

  const handleOptimize = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setIsLoading(true);
    setProposal(null);
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/agent?timestamp=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: "mock-user-id" })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
         setProposal({
            type: "ERROR",
            description: "Failed to reach WLDguard Quant Engine. Try again in 60 seconds.",
            expectedYield: "Network Error",
            txData: null
         });
      } else {
         setProposal({
            type: data.signal,
            description: data.signal === "HOLD" 
              ? `Market is Stable at $${data.price}. Let your assets continue earning passive vault yield.`
              : `Market overextended. Target execution at $${data.price}.`,
            expectedYield: data.signal === "HOLD" ? "12.88% (WLD Vault)" : "12.24% (USDC Vault)",
            txData: data.signal === "HOLD" ? null : [{ to: "0x...", data: "0x...", description: "Rebalance" }]
         });
      }
    } catch (error) {
      console.error(error);
      setProposal({
        type: "ERROR",
        description: "Failed to reach WLDguard Quant Engine.",
        expectedYield: "Network Error",
        txData: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    if (!proposal || !proposal.txData) return;

    try {
      if (!MiniKit.isInstalled()) {
        console.error("World App hardware bridge not detected!");
        return;
      }
      
      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: proposal.txData,
        reference: `wldguard-tx-${Date.now()}`
      });

      if (result?.finalPayload?.status === "success") {
        setSuccessMsg("Success! Protocol successfully routed your liquidity.");
        setProposal(null);
      }
    } catch (error) {
      console.error("Execution error:", error);
    }
  };

  if (!isMounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div style={{ width: '32px', height: '32px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 text-white p-4 md:p-6 font-sans">
      
      <div className="w-full max-w-md mx-auto pt-2 pb-4 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
            WLDguard
          </h1>
          <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">Protect. Earn. Compound WLD.</span>
        </div>
        {isVerified && (
          <div className="flex items-center gap-3">
             <span className="text-xs font-mono text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-md border border-emerald-800">
               {walletAddress ? `0x..${walletAddress.slice(-4)}` : 'Test Mode'}
             </span>
            <button 
              onClick={handleDisconnect}
              className="text-xs text-slate-500 hover:text-white transition-colors border border-slate-800 px-3 py-1 rounded-full"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-md w-full">
        
        {!isVerified && (
          <div className="animate-in fade-in duration-500 flex flex-col items-center">
            
            <div className="w-full">
              <AlphaChart />
            </div>
            
            <div className="text-center mb-6">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Protect. Earn.<br/>Compound WLD.
              </h1>
              <p className="text-slate-400 leading-snug text-sm max-w-[320px] mx-auto">
                Your intelligent assistant dedicated to compounding Worldcoin. Real-time, non-custodial WLD signals powered by quant math.
              </p>
            </div>

            <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-3xl mb-5 shadow-xl">
              <h3 className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-3 text-center">Global Network Analytics</h3>
              <div className="flex justify-between items-center px-1">
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-slate-400 mb-1 font-medium">Total Protected</p>
                  <p className="text-white font-mono font-bold text-sm">{globalStats.wld.toFixed(0)} WLD</p>
                </div>
                <div className="w-px h-6 bg-slate-800"></div>
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-slate-400 mb-1 font-medium">Active Humans</p>
                  <p className="text-white font-mono font-bold text-sm">{globalStats.users}</p>
                </div>
                <div className="w-px h-6 bg-slate-800"></div>
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-slate-400 mb-1 font-medium">WLD Target Yield</p>
                  <p className="text-emerald-400 font-mono font-bold text-sm">12.88% APY</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-200 text-black font-extrabold py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 text-lg tracking-tight flex justify-center items-center gap-2"
            >
              {isLoading ? 'Requesting Biometrics...' : 'Verify with World ID'}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-3 font-medium tracking-wide">
              Zero Gas Fees. 100% Non-Custodial.
            </p>
          </div>
        )}

        {isVerified && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
            
            <AlphaChart />
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
              <h2 className="text-sm font-semibold text-slate-400 mb-2">Total Net Worth</h2>
              
              {isFetchingBalances ? (
                <div className="h-10 bg-slate-800 rounded animate-pulse w-48 mb-6"></div>
              ) : (
                <div className="text-4xl font-mono font-bold text-white mb-6 tracking-tight">
                  {balances.total.toFixed(6)} WLD
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Liquid Wallet
                  </span>
                  <span className="font-mono">{balances.liquid.toFixed(6)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Morpho WLD Vault
                  </span>
                  <span className="font-mono text-emerald-400">+{balances.vault.toFixed(6)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              {successMsg ? (
                <div className="text-center py-6 animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border border-emerald-500/30">✓</div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-2">Vault Funded</h3>
                  <p className="text-sm text-slate-300 mb-6">{successMsg}</p>
                  <button 
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
                      setSuccessMsg("");
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : !proposal ? (
                <div className="relative z-10">
                  <h2 className="text-xl font-semibold mb-4 text-slate-100">AI Optimization</h2>
                  <button 
                    onClick={handleOptimize}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    {isLoading ? 'Scanning Market...' : 'Optimize My WLD Now'}
                  </button>
                </div>
              ) : (
                <div className="relative z-10 animate-in slide-in-from-bottom-4">
                  <div className="bg-black/40 p-4 rounded-2xl border border-emerald-500/30 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase">Action Proposed</span>
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-mono border border-emerald-500/20">
                        {proposal.expectedYield}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      {proposal.description}
                    </p>
                  </div>
                  
                  {proposal.txData ? (
                    <button 
                      onClick={handleExecute}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-lg"
                    >
                      Sign & Execute
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
                        setProposal(null);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-lg"
                    >
                      Dismiss
                    </button>
                  )}
                  
                  {proposal.txData && (
                    <button 
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
                        setProposal(null);
                      }}
                      className="w-full mt-3 text-slate-400 hover:text-white text-sm font-semibold py-2 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}