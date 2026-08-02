"use client";

import React, { useState, useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { TrendingUp, Sparkles, History, Loader2, CheckCircle2 } from 'lucide-react'; 

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

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBalances, setIsFetchingBalances] = useState(true);
  const [authError, setAuthError] = useState("");
  
  const [intentProposal, setIntentProposal] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [balances, setBalances] = useState({ liquid: 0, vault: 0, total: 0 });
  const [globalStats, setGlobalStats] = useState({ users: 0, wld: 0 });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  const [recapData, setRecapData] = useState<any>(null);
  const [showRecap, setShowRecap] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setGlobalStats({ users: data.totalUsers || 1, wld: data.totalWld || 0 }))
      .catch(console.error);

    if (localStorage.getItem('wldguard_session') === 'active') {
      setIsVerified(true);
    }
  }, []);

  useEffect(() => {
    if (isVerified) {
      const loadDashboardData = async () => {
        setIsFetchingBalances(true);
        try {
          const address = MiniKit.walletAddress || localStorage.getItem('wldguard_address'); 
          if (address) {
            setWalletAddress(address);
            const balanceRes = await fetch(`/api/balances?address=${address}`);
            if (balanceRes.ok) {
              const data = await balanceRes.json();
              setBalances({
                liquid: data.liquid || 0,
                vault: data.vault || 0,
                total: (data.liquid || 0) + (data.vault || 0)
              });
            }
          }

          // We will turn OFF the fake ghost user recap for this production test
          const hasGhosted = false; 
          if (hasGhosted) {
             setRecapData({
                daysAway: 14,
                yieldEarned: "+2.4 WLD", 
                intentStatus: "Expired & Safely Dissolved",
                lastAction: "Market chopped sideways. Your capital remained safely parked in the vault."
              });
            setShowRecap(true);
          }
        } catch (error) {
          console.error("Failed to load dashboard data:", error);
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
      if (MiniKit.isInstalled()) {
         const nonce = crypto?.randomUUID?.()?.replace(/-/g, "") || "1234567890abcdef";
         const reqId = crypto?.randomUUID?.() || Date.now().toString(); // 🚨 NEW: Dynamic Request ID prevents silent rejection
         
         const res = await MiniKit.commandsAsync.walletAuth({
            nonce: nonce,
            requestId: reqId,
            expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
            notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            statement: 'Sign in to WLDguard to authorize Intents.'
         });
         
         if (res?.finalPayload?.status === 'success') {
            const address = MiniKit.walletAddress || res.finalPayload.address;
            if (address) {
                localStorage.setItem('wldguard_address', address);
                
                const dbRes = await fetch('/api/user', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ walletAddress: address, termsAccepted: false })
                });
                const userData = await dbRes.json();
                
                if (userData.user && userData.user.termsAccepted) {
                    localStorage.setItem('wldguard_session', 'active');
                    setIsVerified(true);
                } else {
                    setShowTerms(true);
                }
            } else {
                setAuthError("Auth succeeded, but World App didn't return an address.");
            }
         } else {
            // 🚨 NEW: Dump the exact failure reason to the screen!
            setAuthError(`Wallet rejected auth. Status: ${res?.finalPayload?.status || 'Unknown'}`);
            console.log("Auth Error Details:", res);
         }
      } else {
         // Fallback for standard browser
         setTimeout(() => { setShowTerms(true); }, 1000);
      }
    } catch (error: any) {
       console.error("Auth error:", error);
       setAuthError(`System Error: ${error.message}`);
    } finally {
       setIsLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      setIsLoading(true);
      try {
          const address = MiniKit.walletAddress || "0xBrowserTestAddress";
          await fetch('/api/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress: address, termsAccepted: true })
          });
          
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
    setShowRecap(false);
    setWalletAddress(null);
  };

  const handleFetchIntent = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setIsLoading(true);
    setIntentProposal(null);

    try {
      const address = MiniKit.walletAddress || localStorage.getItem('wldguard_address');
      const res = await fetch(`/api/agent?timestamp=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: address,
          balances: balances 
        })
      });
      
      const data = await res.json();
      if (res.ok && data.proposal) {
        setIntentProposal(data.proposal);
      }
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
      if (!MiniKit.isInstalled()) {
        alert("Hardware bridge missing in web simulator. Please use physical phone.");
        setIsLoading(false);
        return;
      }

      // Standard Personal Sign payload (Compatible with World App's security filters)
      const result = await MiniKit.commandsAsync.signMessage({
        message: `WLDguard Pre-Signed Intent\n\nAction: ${intentProposal.type}\nTarget Price: ${intentProposal.targetPrice}\nExpiration: 7 Days\n\nI authorize WLDguard to monitor the market and execute this trade on my behalf when the target price is met.`
      });

      if (result?.finalPayload?.status === "success") {
        const cryptographicSignature = result.finalPayload.signature;
        
        // Save the mathematical proof to our Neon DB
        await fetch('/api/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: MiniKit.walletAddress || localStorage.getItem('wldguard_address'),
                intentData: intentProposal,
                signature: cryptographicSignature
            })
        });

        setSuccessMsg("Success! Your Intent is cryptographically signed and registered. WLDguard will monitor the market for you.");
        setIntentProposal(null);
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
              {walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : 'Connected'}
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
        
        {/* STATE 1: TERMS OF SERVICE (Logged in, but Terms not accepted) */}
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
               onClick={handleVerify}
               disabled={isLoading}
               className="w-full bg-white hover:bg-gray-200 text-black font-extrabold py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 text-lg tracking-tight"
             >
               {isLoading ? 'Verifying...' : 'Verify with World ID'}
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

        {/* STATE 3: THE PRIVATE DASHBOARD (Logged In) */}
        {isVerified && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
            
            {showRecap && recapData ? (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="text-blue-400" size={24} />
                  <h2 className="text-lg font-bold text-white">Welcome Back!</h2>
                </div>
                <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                  You've been away for <span className="text-white font-bold">{recapData.daysAway} days</span>. Here is what happened to your portfolio while you were gone:
                </p>
                <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-slate-700/50 mb-5">
                  <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                    <span className="text-emerald-400 font-bold">Passive Yield Earned</span>
                    <span className="text-emerald-400 font-mono font-bold text-base">{recapData.yieldEarned}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="text-slate-400 flex items-center gap-2"><History size={14}/> Previous Intent</span>
                    <span className="text-slate-300 font-medium">{recapData.intentStatus}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRecap(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Dismiss & View Dashboard
                </button>
              </div>
            ) : (
              <>
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
                  ) : !intentProposal ? (
                    <div className="relative z-10">
                      <h2 className="text-xl font-semibold mb-4 text-slate-100">Set Next Target</h2>
                      <p className="text-sm text-slate-400 mb-5">Your assets are currently parked in high-yield vaults. Ask the AI to forecast your next execution target.</p>
                      <button 
                        onClick={handleFetchIntent}
                        disabled={isLoading || isFetchingBalances}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isLoading && <Loader2 size={18} className="animate-spin" />}
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
                         {isLoading && <Loader2 size={18} className="animate-spin" />}
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
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}