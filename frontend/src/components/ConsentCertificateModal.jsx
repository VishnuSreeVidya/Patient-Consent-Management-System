import React from 'react';
import { ShieldCheck, Printer, X, Award, CheckCircle2 } from 'lucide-react';
import { RECORD_CATEGORIES } from '../contracts/contractConfig';

export default function ConsentCertificateModal({
  isOpen,
  onClose,
  certificateData
}) {
  if (!isOpen || !certificateData) return null;

  const {
    patient,
    doctor,
    category,
    ipfsCID,
    validUntil,
    isEmergency = false,
    reason = ''
  } = certificateData;

  const cat = RECORD_CATEGORIES[category] || RECORD_CATEGORIES[0];
  const certId = 'CERT-' + (ipfsCID ? ipfsCID.substring(0, 10).toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Cryptographic Consent Certificate</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div className="p-8 overflow-y-auto space-y-6">
          <div className="border-2 border-cyan-500/20 rounded-2xl p-6 bg-gradient-to-b from-slate-950/70 to-slate-900/90 relative overflow-hidden">
            <div className="text-center pb-6 border-b border-slate-800">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> HIPAA / Web3 Verified Standard
              </div>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Decentralized Patient Consent Management System</h2>
              <p className="text-xs text-slate-400 mt-1">Official Electronic Health Record (EHR) Authorization Credential</p>
              <p className="text-[11px] font-mono text-cyan-400/80 mt-1">Serial: {certId}</p>
            </div>

            {/* Content Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Patient (Record Sovereign)</p>
                <p className="font-mono text-cyan-300 font-bold mt-1 break-all">{patient || '0x...'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Authorized Physician</p>
                <p className="font-mono text-emerald-400 font-bold mt-1 break-all">{doctor || '0x...'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Record Category</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={'px-2 py-0.5 rounded-md text-[11px] font-semibold border ' + (cat.bg || 'bg-slate-800') + ' ' + (cat.text || 'text-slate-300') + ' ' + (cat.border || 'border-slate-700')}>
                    {cat.label}
                  </span>
                  <span className="text-[11px] text-slate-400">({cat.desc})</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">On-Chain Expiration</p>
                <p className="font-medium text-slate-200 mt-1">
                  {validUntil ? new Date(Number(validUntil) * 1000).toLocaleString() : 'Permanent / Revocable'}
                </p>
              </div>

              <div className="md:col-span-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">IPFS Cryptographic Content Identifier (CID)</p>
                <p className="font-mono text-slate-300 text-[11px] mt-1 break-all">{ipfsCID || 'N/A'}</p>
              </div>

              {isEmergency && (
                <div className="md:col-span-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-[10px] text-red-400 uppercase font-semibold">Emergency Break-Glass Justification</p>
                  <p className="text-xs text-red-200 mt-1 italic">"{reason}"</p>
                </div>
              )}
            </div>

            {/* Cryptographic Seal */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">EVM Smart Contract Verified</p>
                  <p className="text-[10px] text-slate-400">State enforced by Ethereum consensus engine</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  AUTHENTICATED RECORD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
