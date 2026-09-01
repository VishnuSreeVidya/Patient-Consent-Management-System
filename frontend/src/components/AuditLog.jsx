import React from 'react';
import { Activity, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

export default function AuditLog({ logs = [] }) {
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-100">Live Blockchain Audit Log</h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Real-time Event Stream
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-x{ text-slate-500 border border-slate-800 rounded-xl">
          No blockchain transactions recorded in current session.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {logs.map((log, i) => (
            <div
              key={i}
              className="flex items-start justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-x-1.5 py-1.5 rounded-lg mt-0.5 ${
                    log.type === 'grant'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {log.type === 'grant' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{log.message}</p>
                  {log.txHash && (
                    <p className="font-mono text-[11px] text-cyan-400 mt-0.5 truncate max-w-[280px] sm:max-w-md">
                      TX: {log.txHash}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0 ml-2">
                <Clock className="w-3 h-3 text-slate-400" />
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}