"use client";

import React, { useState, useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { TrendingUp, Sparkles, History, Loader2, CheckCircle2, Radar } from 'lucide-react';

const AlphaChart = () => {
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const data = [
    { x: 0,   label: 'Jan', passive: 100, alpha: 100 },
    { x: 80,  label: 'Feb', passive: 92,  alpha: 108 },
    { x: 160, label: 'Mar', passive: 85,  alpha: 115 },
    { x: 240, label: 'Apr', passive: 105, alpha: 125 },
    { x: 320, label: 'May', passive: 90,  alpha: 132 },
    { x: 400, label: 'Jun', passive: 88,  alpha: 142.8 },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-5 shadow-2xl relative overflow-hidden group w-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-1">Strategy Performance (Backtest)</h2>
          <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-emerald-400">+42.8%</span> vs Hold
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
          <path d="M0,80 L80,88 L160,95 L240,75 L320,90 L400,92" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M0,80 L80,72 L160,65 L240,55 L320,48 L400,20 L400,100 L0,100 Z" fill="url(#greenGlow)" />
          <path d="M0,80 L80,72 L160,65 L240,55 L320,48 L400,20" fill="none" stroke="#10b981" strokeWidth="3" />
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

// Strict TypeScript Interfaces for Vercel
interface IntentData {
  type: string;
  targetPrice: string;
  description: string;
  expectedYield: string;
  actionText: string;
}

interface ReceiptData {
  targetPrice: string;
  description: string;
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBalances, setIsFetchingBalances] = useState(true);
  const [authError, setAuthError] = useState("");
  
  const [intentProposal, setIntentProposal] = useState<IntentData | null>(null);
  const [activeIntent, setActiveIntent] = useState<IntentData | null>(null);
  const [recentReceipt, setRecentReceipt] = useState<ReceiptData | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [balances, setBalances] = useState({ liquid: 0, vault: 0, total: 0 });
  const [globalStats, setGlobalStats] = useState({ users: 8492, wld: 1420500 });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (localStorage.getItem('wldguard_session') === 'active') {
      setIsVerified(true);
      const savedAddress = localStorage.getItem('wldguard_address');
      if (savedAddress) setWalletAddress(savedAddress);
    }
  }, []);

  useEffect(() => {
    if (isVerified) {
      const loadDashboardData = async () => {
        setIsFetchingBalances(true);
        try {
          // Simulate network load for premium feel
          await new Promise(r => setTimeout(r, 600));
          setBalances({ liquid: 142.8, vault: 0, total: 142.8 });
        } catch (error) {
          console.error("Failed to load balances:", error);
        } finally {
          setIsFetchingBalances(false);
        }
      };
      loadDashboardData();
    }
  }, [isVerified]);

  const handleVerify = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setIsLoading(true);
    setAuthError("");
    try {
      // Simulate smooth World ID auth process
      await new Promise(r => setTimeout(r, 1000));
      setShowTerms(true);
    } catch (error: unknown) {
       const msg = error instanceof Error ? error.message : String(error);
       setAuthError(`System Error: ${msg}`);
    } finally {
       setIsLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      setIsLoading(true);
      try {
          await new Promise(r => setTimeout(r, 500));
          localStorage.setItem('wldguard_session', 'active');
          setShowTerms(false);
          setIsVerified(true);
      } catch (error) {
          console.error("Failed to save terms:", error);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('wldguard_session');
    localStorage.removeItem('wldguard_address');
    setIsVerified(false);
    setIntentProposal(null);
    setActiveIntent(null);
    setRecentReceipt(null);
    setWalletAddress(null);
  };

  const handleFetchIntent = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setIsLoading(true);
    setIntentProposal(null);

    try {
      // Simulate Quant Engine Forecasting
      await new Promise(r => setTimeout(r, 1500));
      setIntentProposal({
         type: 'SELL_INTENT',
         targetPrice: '>= $2.45',
         description: 'Automatically route 71.40 WLD to USDC if the upper Bollinger Band is breached.',
         expectedYield: 'Lock in +42.8% vs Hold',
         actionText: 'Sell 71.40 WLD at $2.45'
      });
    } catch (error) {
      console.error("Failed to fetch intent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIntent = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setIsLoading(true);
    try {
      const intentString = 
`WLDGUARD LIMIT ORDER
--------------------
Action: ${intentProposal?.actionText}
Target Price: ${intentProposal?.targetPrice}
Treasury: 0x5b9ADA2755Db4B89545Ac072d3Eaa848fB8B365C
Expiration: 7 Days`;

      const response = await MiniKit.signMessage({ message: intentString });

      if (response?.data?.status === "success") {
        const capturedSig = response.data.signature;
        
        // Send real signature to Neon Database via our Next.js API route
        const apiRes = await fetch('/api/save-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent_action: intentProposal?.actionText,
            signature: capturedSig
          })
        });
        
        const dbResult = await apiRes.json();
        
        if (dbResult.success) {
           setActiveIntent(intentProposal);
           setSuccessMsg("Success! Your Intent is cryptographically signed and registered. WLDguard is monitoring the market.");
           setIntentProposal(null);
        } else {
           alert("Database Error: Could not save signature.");
        }
      }
    } catch (error) {
      console.error("Signing error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div style={{ width: '32px', height: '32px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 text-white font-sans p-4">
      
      {/* Global Header */}
      <div className="w-full max-w-md mx-auto pt-2 pb-4 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp size={22} className="text-emerald-400" />
            WLDguard
          </h1>
          <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">Protect. Earn. Compound.</span>
        </div>
        {isVerified && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-mono mb-2">
              Connected
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
        
        {/* STATE 1: THE STOREFRONT */}
        {!showTerms && !isVerified && (
          <div className="animate-in fade-in duration-500 flex flex-col items-center">
            <div className="w-full">
              <AlphaChart />
            </div>
            
            <div className="text-center mb-6 mt-4">
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
                  <p className="text-white font-mono font-bold text-sm">{(globalStats.wld).toLocaleString()} WLD</p>
                </div>
                <div className="w-px h-6 bg-slate-800"></div>
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-slate-400 mb-1 font-medium">Active Humans</p>
                  <p className="text-white font-mono font-bold text-sm">{(globalStats.users).toLocaleString()}</p>
                </div>
                <div className="w-px h-6 bg-slate-800"></div>
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-slate-400 mb-1 font-medium">Target Yield</p>
                  <p className="text-emerald-400 font-mono font-bold text-sm">12.88% APY</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-200 text-black font-extrabold py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 text-lg tracking-tight flex justify-center items-center gap-2"
            >
              {isLoading && <Loader2 size={18} className="animate-spin text-black" />}
              {isLoading ? 'Verifying Identity...' : 'Verify with World ID'}
            </button>
            {authError && (
              <p className="text-center text-xs text-red-400 mt-3 bg-red-950/50 p-2 rounded-lg border border-red-900/50">
                {authError}
              </p>
            )}
            <p className="text-center text-[11px] text-slate-500 mt-3 font-medium tracking-wide">
              Zero Gas Fees. 100% Non-Custodial.
            </p>
          </div>
        )}

        {/* STATE 2: TERMS OF SERVICE */}
        {showTerms && !isVerified && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                 <h2 className="text-xl font-bold text-white mb-2">Terms of Service</h2>
                 <p className="text-sm text-slate-400 mb-4">Please review before continuing.</p>
                 
                 <div
                    className="bg-black/50 border border-slate-800 rounded-xl p-4 h-64 overflow-y-auto mb-6 text-sm text-slate-300 space-y-4"
                    onScroll={(e) => {
                       const target = e.target as HTMLElement;
                       if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
                          setHasScrolledTerms(true);
                       }
                    }}
                 >
                    <p className="font-bold text-white">1. Nature of the Service</p>
                    <p>WLDguard is a non-custodial software interface. We do not hold, control, or have access to your funds.</p>
                    
                    <p className="font-bold text-white mt-4">2. No Investment Advice</p>
                    <p>WLDguard provides impersonal, mathematically derived quantitative signals based on rolling market volatility. WLDguard does not provide personalized financial advice. You retain 100% discretion and must explicitly authorize every Intent.</p>
                    
                    <p className="font-bold text-white mt-4">3. Assumption of Risk</p>
                    <p>Cryptocurrency markets are highly volatile. By authorizing WLDguard to monitor and route your assets to decentralized exchanges (DEXs) or protocols, you acknowledge smart contract risks. WLDguard is not liable for financial losses.</p>
                    
                    <p className="text-xs text-slate-500 italic mt-6">*Scroll to the bottom to accept.</p>
                 </div>
             
                 <button
                   onClick={handleAcceptTerms}
                   disabled={isLoading || !hasScrolledTerms}
                   className={`w-full font-extrabold py-3.5 rounded-2xl transition-all shadow-lg text-lg tracking-tight ${
                     hasScrolledTerms
                       ? 'bg-emerald-500 hover:bg-emerald-400 text-white active:scale-95'
                       : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                   }`}
                 >
                   {isLoading ? 'Accepting...' : 'I Accept'}
                 </button>
              </div>
           </div>
        )}

        {/* STATE 3: THE PRIVATE DASHBOARD */}
        {isVerified && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
            
            <AlphaChart />

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
              <h2 className="text-sm font-semibold text-slate-400 mb-2">Total Net Worth</h2>
              
              {isFetchingBalances ? (
                <div className="h-10 w-48 bg-slate-800 rounded animate-pulse mb-6"></div>
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
                  <span className="font-mono">{isFetchingBalances ? '...' : balances.liquid.toFixed(6)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Morpho Vaults
                  </span>
                  <span className="font-mono text-emerald-400">+{isFetchingBalances ? '...' : balances.vault.toFixed(6)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
              {successMsg ? (
                <div className="text-center py-6 animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border border-emerald-500/30">✓</div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-2">Intent Authorized</h3>
                  <p className="text-sm text-slate-300 mb-6">{successMsg}</p>
                  <button
                    onClick={() => setSuccessMsg("")}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : recentReceipt ? (
                <div className="relative z-10 animate-in slide-in-from-bottom-4 text-center py-2">
                  <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <History size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Trade Executed!</h3>
                  <p className="text-sm text-slate-300 mb-6 font-medium">
                    While you were away, WLDguard successfully caught a volatility spike and executed your intent.
                  </p>
                  
                  <div className="bg-black/50 border border-slate-700 p-4 rounded-2xl mb-6 text-left shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] text-slate-500 uppercase tracking-wider">Execution Price</span>
                       <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-mono border border-emerald-500/20">Success</span>
                    </div>
                    <span className="text-3xl font-mono font-bold text-emerald-400 block mb-3">{recentReceipt.targetPrice}</span>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                      {recentReceipt.description}
                    </p>
                  </div>

                  <button
                    onClick={() => setRecentReceipt(null)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    Awesome!
                  </button>
                </div>
              ) : activeIntent ? (
                <div className="relative z-10 animate-in slide-in-from-bottom-4">
                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-2xl mb-2 shadow-inner">
                    <div className="flex justify-between items-center mb-4 border-b border-emerald-900/50 pb-3">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <Radar size={16} className="animate-pulse" />
                        Active Monitoring
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono">
                        Standby
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Execution Trigger</span>
                      <span className="text-3xl font-mono font-bold text-white block">{activeIntent.targetPrice}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      WLDguard is actively monitoring the World Chain. Your intent will automatically execute if this mathematical threshold is reached.
                    </p>
                  </div>
                </div>
              ) : !intentProposal ? (
                <div className="relative z-10">
                  <h2 className="text-xl font-semibold mb-4 text-slate-100">Set Next Target</h2>
                  <p className="text-sm text-slate-400 mb-5">Your assets are currently parked in high-yield vaults. Ask the AI to forecast your next execution target.</p>
                  <button
                    onClick={handleFetchIntent}
                    disabled={isLoading || isFetchingBalances}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 size={18} className="animate-spin text-white" />}
                    {isLoading ? 'Forecasting Market Bounds...' : 'Generate New Intent Target'}
                  </button>
                </div>
              ) : (
                <div className="relative z-10 animate-in slide-in-from-bottom-4">
                  <div className="bg-black/40 p-5 rounded-2xl border border-blue-500/30 mb-6">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Proposed Intent</span>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono">
                        Expires: 7 Days
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Execution Trigger</span>
                      <span className="text-2xl font-mono font-bold text-emerald-400 block">{intentProposal.targetPrice}</span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed font-medium mb-4">
                      {intentProposal.description}
                    </p>
                    
                    <div className="bg-slate-800/50 p-3 rounded-xl">
                       <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Post-Execution Status</span>
                       <span className="text-xs font-mono text-emerald-400">{intentProposal.expectedYield}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSignIntent}
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-lg flex items-center justify-center gap-2"
                  >
                     {isLoading && <Loader2 size={18} className="animate-spin text-white" />}
                     {isLoading ? 'Signing...' : 'Sign & Authorize Intent'}
                  </button>
                  <button
                    onClick={() => setIntentProposal(null)}
                    disabled={isLoading}
                    className="w-full mt-3 text-slate-400 text-sm font-semibold py-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
