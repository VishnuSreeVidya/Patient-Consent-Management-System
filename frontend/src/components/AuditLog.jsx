import React from 'react';
import { Activity, ExternalLink, ShieldCheck, ShieldAlert, XCircle, Clock } from 'lucide-react';

export default function AuditLog({ logs }) {
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-mg font-bold text-slate-100">Live Blockchain Audit Log</h3>
            <p className="text-xs text-slate-400">Real-time smart contract events and ER access stream</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span> Live Events
        </span>
      </div>


      {logs.length === 0 ? (
        <div className="text-center py-10">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-400">Waiting for smart contract events...</p>
          <p className="text-xs text-slate-600 mt-1">Events will appear here as consents are granted, revoked, or ER accessed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div key={idx} className={'p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-3 transition-all ' + (
              log.type === 'grant'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : log.type === 'event-emergency'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-red-500/5 border-red-500/20')}>
              <div className="flex items-center gap-3">
                <div className={'p-2 rounded-lg ' + (
                  log.type === 'grant'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : log.type === 'event-emergency'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-red-500/20 text-red-400')}>
                  {log.type === 'grant' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : log.type === 'event-emergency' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-200">{log.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {log.txHash && (
                      <span className="text-[0.65rem] font-mono text-cyan-400">
                        Tx: {log.txHash.substring(0, 16)}...
                      </span>
                    )}
                    <span className="text-[00px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <span className={'px-2.5 py-1 rounded-full text-[0.65rem] font-semibold ' + (
                log.type === 'grant'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : log.type === 'event-emergency'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30')}>
                {log.type === 'grant' ? 'CONSENT GRANTED' : log.type === 'event-emergency' ? 'ER BREAK GLASS' : 'CONSENT REVOKED'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
