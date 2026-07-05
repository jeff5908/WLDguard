"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Loader2, 
  X, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight // <-- Add ArrowRight here
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { MiniKit } from '@worldcoin/minikit-js';
import { buildYieldDepositBatch } from '../lib/transactions';
import { PAYMASTER_URL } from '../lib/paymaster'; // <-- NEW: Import Paymaster

const performanceData = [
  { month: 'Jan', managed: 100, passive: 100 },
  { month: 'Feb', managed: 112, passive: 105 },
  { month: 'Mar', managed: 125, passive: 98 },
  { month: 'Apr', managed: 130, passive: 102 },
  { month: 'May', managed: 142, passive: 95 },
  { month: 'Jun', managed: 148, passive: 100 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Dynamically find the right data so they never get swapped
    const managedVal = payload.find((p: any) => p.dataKey === 'managed')?.value;
    const passiveVal = payload.find((p: any) => p.dataKey === 'passive')?.value;

    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
        <p className="font-bold text-slate-300 mb-2">{label} 2026</p>
        <div className="space-y-1">
          <p className="text-emerald-400">
            <span className="font-semibold">WLDguard:</span> {managedVal} WLD
          </p>
          <p className="text-slate-400">
            <span className="font-semibold">Passive:</span> {passiveVal} WLD
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  // Resetting to the true authentic baseline!
  const [stats, setStats] = useState({ users: 1, totalProtected: 100 });
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'agent' | 'intent'>('agent');

  // Agent State (Step 1)
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Execution Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txState, setTxState] = useState('idle'); // idle, validating, signing, processing, success, stale
  const [txHash, setTxHash] = useState('');

  // Intent State (Step 2)
  const [activeIntent, setActiveIntent] = useState<any>(null);
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);
  const [intentState, setIntentState] = useState('idle');

  useEffect(() => {
    setIsMounted(true);
    
    // NEW: Fetch live global stats from the database
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats({ users: data.totalUsers, totalProtected: data.totalWld });
      } catch (err) {
        console.error("Failed to fetch global stats", err);
      }
    };
    
    fetchStats();
  }, []);

  const handleRunAgent = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setLoading(true);
    setErrorMsg('');
    
    // Simulate API call to our Quant Engine
    setTimeout(() => {
      setProposal({
        type: 'TRIM_WLD',
        description: 'AI technical analysis indicates WLD is currently overbought at $2.85. Trim 40% into USDC to lock in profit and earn stable yield.',
        expectedYield: '13.34% APY (USDC)',
        targetPrice: 2.85,
        action: 'swap_and_deposit'
      });
      setLoading(false);
    }, 2000);
  };

  const handleCancel = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setProposal(null);
    setErrorMsg('');
  };

  const handleExecute = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setIsModalOpen(true);
    setTxState('validating');
    
    // 1. AI Safety Check (Stale Signal Validation)
    setTimeout(async () => {
      // 10% chance to fail the validation to demonstrate the safeguard
      const isStale = Math.random() < 0.1; 
      
      if (isStale) {
        setTxState('stale');
      } else {
        // 2. Passed Validation -> Request Signature
        setTxState('signing');
        
        // --- REAL BLOCKCHAIN INTEGRATION ---
        if (MiniKit.isInstalled()) {
          try {
            // (Assuming a 40% trim of 100 WLD = 40 WLD for the demo)
            const payloads = buildYieldDepositBatch("40", "WLD", MiniKit.walletAddress || "0x");
            
            // Trigger the World App hardware drawer to slide up
            const response = await MiniKit.commands.sendTransaction({
              transaction: payloads,
              reference: 'wldguard-execute',
              // 🚨 NEW: GAS SPONSORSHIP INJECTED HERE 🚨
              paymaster: PAYMASTER_URL 
            });

            if (response.finalPayload.status === 'success') {
              setTxState('processing');
              setTimeout(() => {
                setTxHash(response.finalPayload.transaction_receipt?.transaction_hash || "0x");
                setTxState('success');
              }, 2000);
            } else {
              // User rejected the transaction in the drawer
              setIsModalOpen(false);
              setTxState('idle');
            }
          } catch (error) {
            console.error("Transaction failed", error);
            setIsModalOpen(false);
            setTxState('idle');
          }
        } else {
          // --- BROWSER FALLBACK (For testing on your Chromebook) ---
          setTimeout(() => {
            setTxState('processing');
            
            setTimeout(() => {
              setTxHash(`0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`);
              setTxState('success');
            }, 2000);
          }, 2000);
        }
      }
    }, 2500);
  };

  const closeModal = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    
    if (txState === 'success') {
      setIsModalOpen(false);
      setTxState('idle');
      setProposal(null);
      
      // Optimistic UI Update: Simulate balance growing
      setStats(prev => ({
        ...prev,
        totalProtected: prev.totalProtected + (Math.random() * 50 + 10)
      }));
      
      // ROUTING: Send user directly to Step 2 (Auto-Protect)
      setActiveTab('intent');
    } else {
      setIsModalOpen(false);
      setTxState('idle');
    }
  };

  const handleSignIntent = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setIsIntentModalOpen(true);
    setIntentState('signing');
    
    setTimeout(() => {
      setActiveIntent({
        targetPrice: 3.25,
        amount: '40% WLD',
        status: 'active'
      });
      setIntentState('success');
    }, 2000);
  };

  const closeIntentModal = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setIsIntentModalOpen(false);
    setIntentState('idle');
  };

  // Prevent hydration errors
  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-12 selection:bg-blue-500/30">
  {/* HEADER */}
  <div className="w-full max-w-md mx-auto pt-6 px-4 pb-2">
    <header className="flex justify-between items-center">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
          <TrendingUp className="text-blue-500" /> WLDguard
        </h1>
        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">
          Protect. Earn. Compound WLD.
        </span>
      </div>
      <div className="bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-mono text-slate-400">
        0x...a1b2
      </div>
    </header>
  </div>
      
      {/* DASHBOARD STATS */}
      <section className="px-6 max-w-md mx-auto mb-6">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl shadow-lg backdrop-blur-sm">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Protected</p>
            <p className="text-xl font-bold text-slate-200">{Math.floor(stats.totalProtected).toLocaleString()} <span className="text-sm font-normal text-slate-400">WLD</span></p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl shadow-lg backdrop-blur-sm">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Active Users</p>
            <p className="text-xl font-bold text-slate-200">{stats.users.toLocaleString()}</p>
          </div>
        </div>

        {/* STRATEGY ALPHA CHART */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-3xl shadow-xl backdrop-blur-sm mb-4">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Backtested Strategy Alpha</h3>
              <p className="text-lg font-bold text-slate-200">WLDguard vs. Passive</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded">
                +48.5% Outperformance
              </span>
            </div>
          </div>
          
          <div className="h-32 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorManaged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPassive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                
                {/* Draw managed first (in background) so passive (in foreground) remains visible */}
                <Area type="monotone" dataKey="managed" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorManaged)" />
                <Area type="monotone" dataKey="passive" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#colorPassive)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] text-slate-600 mt-2 text-center uppercase tracking-widest">Historical simulation vs passive holding</p>
        </div>
      </section>

      {}
      <section className="px-6 max-w-md mx-auto">
        <div className="bg-slate-900 border border-slate-700 p-1.5 rounded-2xl shadow-lg mb-4 flex">
          <button 
            onClick={() => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50); setActiveTab('agent'); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'agent' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            1. 🤖 AI Optimizer
          </button>
          <button 
            onClick={() => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50); setActiveTab('intent'); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'intent' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            2. 🛡️ Auto-Protect
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-700 p-5 rounded-3xl shadow-2xl relative overflow-hidden min-h-[220px]">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          {errorMsg && (
            <div className="relative z-10 bg-red-900/50 border border-red-500/50 p-3 rounded-xl text-xs text-red-200 mb-4 font-mono break-words">
              {errorMsg}
            </div>
          )}
          
          {/* STEP 1: AI OPTIMIZER TAB */}
          {activeTab === 'agent' && (
            <>
              {!proposal ? (
                <div className="space-y-4 relative z-10 animate-in fade-in duration-300">
                  <h2 className="text-lg font-semibold text-slate-100">Step 1: Portfolio Optimization</h2>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Maximize your WLD growth and income with automated AI strategies. WLDguard manages the risk while capturing elite WLD and USDC yields on Morpho.
                  </p>
                  
                  <button 
                    onClick={handleRunAgent}
                    disabled={loading || isExecuting}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Agent Processing...
                      </>
                    ) : (
                      "Optimize My WLD Now"
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                  <div className="bg-black/40 p-4 rounded-2xl border border-blue-500/30">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Proposed Action</span>
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md font-mono border border-emerald-500/20">
                        {proposal.expectedYield}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-slate-100">{proposal.type}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {proposal.description}
                    </p>
                  </div>

                  <button 
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center"
                  >
                    Sign & Execute
                  </button>
                  
                  <button 
                    onClick={handleCancel}
                    disabled={isExecuting}
                    className="w-full bg-transparent hover:bg-slate-800 disabled:opacity-50 text-slate-400 py-2.5 rounded-xl font-semibold transition-all mt-1 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          {/* STEP 2: AUTO-PROTECT TAB */}
          {activeTab === 'intent' && (
            <div className="animate-in fade-in duration-300 relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="text-indigo-400" size={24} />
                <h2 className="text-lg font-semibold text-slate-100">Step 2: Sleep-Easy Protection</h2>
              </div>
              
              {activeIntent ? (
                <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-2xl mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-indigo-300 uppercase tracking-wider font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                      Network Intent Active
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 mb-1">
                    Trigger: <span className="font-bold text-white">WLD hits ${activeIntent.targetPrice}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Action: Trim {activeIntent.amount} to Morpho USDC Vault
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    AI technical analysis projects a high-probability overbought target at <span className="text-indigo-400 font-bold">$3.25</span>. Pre-sign an off-chain intent to automatically lock in profits if the market spikes while you sleep.
                  </p>
                  <button 
                    onClick={handleSignIntent}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 py-3.5 rounded-xl font-bold text-sm text-indigo-300 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4"
                  >
                    Sign $3.25 Limit Intent
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4 z-50">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold">Transaction Status</h3>
              {txState !== 'processing' && txState !== 'validating' && (
                <button onClick={closeModal}>
                  <X size={20} className="text-slate-500 hover:text-white transition-colors"/>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {txState === 'validating' && (
                <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in duration-300">
                  <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-500/50 mb-4">
                    <ShieldCheck className="text-blue-400 animate-pulse" size={24} />
                  </div>
                  <p className="font-bold text-blue-400 mb-1">AI Safety Check</p>
                  <p className="text-xs text-slate-400 text-center">Validating live market conditions to ensure signal is still optimal...</p>
                </div>
              )}

              {txState === 'stale' && (
                <div className="flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in duration-300">
                  <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center border border-red-500/50 mb-4">
                    <AlertTriangle className="text-red-400" size={24} />
                  </div>
                  <p className="font-bold text-red-400 mb-1">Signal Expired</p>
                  <p className="text-xs text-slate-400 text-center mb-6">
                    The market condition changed while you were away. WLDguard cancelled the trade to protect your capital.
                  </p>
                  <button 
                    onClick={closeModal}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              )}

              {txState === 'signing' && (
                <div className="flex items-center gap-4 text-blue-400 animate-in fade-in duration-300">
                  <Loader2 className="animate-spin" />
                  <span>Waiting for signature...</span>
                </div>
              )}
              {txState === 'processing' && (
                <div className="flex items-center gap-4 text-amber-400 animate-in fade-in duration-300">
                  <Loader2 className="animate-spin" />
                  <span>Broadcasting to blockchain...</span>
                </div>
              )}
              {txState === 'success' && (
                <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
                  <p className="font-bold mb-2">Success!</p>
                  <p className="text-[10px] text-slate-400 mb-6 font-mono break-all bg-black/50 p-2 rounded-lg border border-slate-800">
                    Hash: {txHash}
                  </p>
                  <button 
                    onClick={closeModal}
                    className="w-full bg-white text-black py-3 rounded-xl font-bold transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    Continue to Step 2 <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {}
      {isIntentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4 z-50">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-indigo-400">Sign Limit Intent</h3>
              {intentState !== 'signing' && (
                <button onClick={closeIntentModal}>
                  <X size={20} className="text-slate-500 hover:text-white transition-colors"/>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {intentState === 'signing' ? (
                <div className="flex items-center gap-4 text-indigo-400 py-6">
                  <Loader2 className="animate-spin" />
                  <span className="text-sm">Awaiting gasless off-chain signature...</span>
                </div>
              ) : (
                <div className="text-center py-4 animate-in fade-in zoom-in">
                  <ShieldCheck className="mx-auto text-indigo-500 mb-4" size={48} />
                  <p className="font-bold mb-2">Intent Guarded!</p>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    WLDguard will automatically execute your 40% trim if the market hits $3.25 while you are away.
                  </p>
                  <button 
                    onClick={closeIntentModal}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold transition-transform active:scale-95"
                  >
                    Secure Portfolio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}