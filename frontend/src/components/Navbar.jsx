import React from 'react';
import { ShieldCheck, Wallet, User, Stethoscope } from 'lucide-react';

export default function Navbar({ account, balance, network, activeTab, setActiveTab, onConnect, onDisconnect, connecting }) {
  const formatAddress = (addr) => addr ? (addr.substring(0, 6) + '...' + addr.substring(addr.length - 4)) : '';
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">MedConsent</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium">Web3</span>
            </div>
            <p className="text-xs text-slate-400">Decentralized Patient Consent & IPFS Vault</p>
          </div>
        </div>
        <div className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800 shadow-inner">
          <button onClick={() => setActiveTab('patient')} className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ' + (activeTab === 'patient' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50')}>
            <User className="w-4 h-4" /> Patient Portal
          </button>
          <button onClick={() => setActiveTab('doctor')} className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ' + (activeTab === 'doctor' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50')}>
            <Stethoscope className="w-4 h-4" /> Doctor Portal
          </button>
        </div>
        <div className="flex items-center gap-3">
          {network && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{network}</span>
            </div>
          )}
          {account ? (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 p-1.5 rounded-xl">
              <div className="px-2.5 py-1 text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-200">{formatAddress(account)}</p>
                <p className="text-[11px] text-cyan-400 font-mono">{balance ? (parseFloat(balance).toFixed(3) + ' ETH') : '0 ETH'}</p>
              </div>
              <button onClick={onDisconnect} className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 border border-slate-700 rounded-lg transition-all">Disconnect</button>
            </div>
          ) : (
            <button onClick={onConnect} disabled={connecting} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50">
              <Wallet className="w-4 h-4" /> {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}