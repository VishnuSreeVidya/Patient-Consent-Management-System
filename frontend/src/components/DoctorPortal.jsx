import React, { useState } from 'react';
import { Stethoscope, Search, ShieldCheck, ShieldAlert, FileText, Key, Download, Eye, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchAndDecryptMedicalRecord } from '../services/ipfs';

export default function DoctorPortal({ contract, account, contractAddress }) {
  const [patientAddress, setPatientAddress] = useState('0xf39Pd6E51aad88F6F4Ce6aB8827279cffFb92266');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [secretKey, setSecretKey] = useState('patient-secret-key-2026');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedDoc, setDecryptedDoc] = useState(null);
  const [decryptError, setDecryptError] = useState(null);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!contract || !account) { alert('Please connect your MetaMask wallet first.'); return; }
    if (!patientAddress) { alert('Please enter a valid Patient Address.'); return; }
    setVerifying(true);
    setVerificationResult(null);
    setDecryptedDoc(null);
    setDecryptError(null);
    try {
      const [hasAccess, ipfsCID] = await contract.verifyConsent(patientAddress, account);
      const registryData = await contract.consentRegistry(patientAddress, account);
      setVerificationResult({
        hasAccess,
        ipfsCID,
        isGranted: registryData.isGranted,
        validUntil: Number(registryData.validUntil),
        timestamp: Date.now(),
      });
    } catch (err) { alert('Smart Contract query failed: ' + (err.reason || err.message)); } finally { setVerifying(false); }
  };

  const handleDecryptRecord = async () => {
    if (!verificationResult?.ipfsCID) return;
    setDecrypting(true);
    setDecryptError(null);
    try {
      const doc = await fetchAndDecryptMedicalRecord(verificationResult.ipfsCID, secretKey);
      setDecryptedDoc(doc);
    } catch (err) { setDecryptError(err.message || 'Decryption failed.'); } finally { setDecrypting(false); }
  };

  const formatRemainingTime = (validUntil) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = validUntil - now;
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 24) return Math.floor(h / 24) + ' days, ' + (h % 24) + ' h left';
    if (h > 0) return h + 'h ' + m + 'm left';
    return m + 'm ' + s + 's left';
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
              <Stethoscope className="w-4 h-4" /> Doctor Diagnostic Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Medical Consent Verification & Record Access</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">Query smart contract verifyConsent(patient, doctor) to validate access permissions and deview decrypted IPFS records.</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <p className="text-xs text-slate-300 font-medium">Doctor Wallet: Connected</p>
            <p className="text-emerald-400 font-mono text-xs font-semibold mt-0.5">{account ? account.substring(0, 10) + '...' : 'Not Connected'}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-emerald-400" /> Verify Patient Consent
        </h2>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Patient Ethereum Address</label>
            <input type="text" value={patientAddress} onChange={(e) => setPatientAddress(e.target.value)} placeholder="0x..." className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono" required />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400">Test Patient Account:</span>
              <button type="button" onClick={() => setPatientAddress('0xf39Pd6E51aad88F6F4Ce6aB8827279cffFb92266')} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono border border-slate-700">Patient #0</button>
            </div>
          </div>
          <button type="submit" disabled={verifying} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white text-xs font-bold shadow-mg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {verifying ? 'Querying Smart Contract...' : 'Verify Consent On-Chain'}
          </button>
        </form>
      </div>

      {verificationResult && (
        <div className="max-w-3xl mx-auto">
          {verificationResult.hasAccess ? (
            <div className="glass-card p-6 rounded-2xl border-emerald-500/30 bg-emerald-950/10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">CONSENT VERIFIED : ACTIVE</span>
                  <h3 className="text-lg font-bold text-white mt-1">Access Granted by Patient</h3>
                  <p className="text-xs text-slate-400">Validity: <span className="text-emerald-400 font-medium">{formatRemainingTime(verificationResult.validUntil)}</span></p>
                </div>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">IPFS CID:</span>
                  <span className="text-emerald-300 font-mono">{verificationResult.ipfsCID}</span>
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">Enter Decryption Key to View Medical Record</label>
                <div className="flex gap-2">
                  <input type="text" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="flex-1 glass-input px-3 py-2 rounded-xl text-xs font-mono" />
                  <button onClick={handleDecryptRecord} disabled={decrypting} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5">
                    <Key className="w-4 h-4" /> {decrypting ? 'Decrypting...' : 'Decrypt Record'}
                  </button>
                </div>
                </div>

              {decryptedDoc && (
                <div className="glass-panel p-5 rounded-xl border-emerald-500/20 bg-slate-900/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white">{decryptedDoc.fileName}</h4>
                        <p className="text-[11px] text-slate-400">{decryptedDoc.documentType}</p>
                      </div>
                    </div>
                    {decryptedDoc.fileData && (
                      <a href={decryptedDoc.fileData} download={decryptedDoc.fileName} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/40">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    )}
                  </div>
                  {decryptedDoc.patientNotes && (
                    <div className="bg-slate-950/60 p-3 rounded-lg text-xs">
                      <span className="text-slate-400 font-semibold block mb-0.5">Patient Notes:</span>
                      <p className="text-slate-200">{decryptedDoc.patientNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-6 rounded-2xl border-red-500/30 bg-red-950/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-mg font-bold text-white">Access Denied by Smart Contract</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">No active, valid consent was found on-chain for your doctor address from this patient.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
