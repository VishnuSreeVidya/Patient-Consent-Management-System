import React, { useState } from 'react';
import { Stethoscope, ShieldCheck, ShieldAlert, Unlock, FileText, Download, Eye, X, ZoomIn, ZoomOut } from 'lucide-react';
import { decryptMedicalRecord } from '../services/ipfs';
import { RECORD_CATEGORIES } from '../contracts/contractConfig';

export default function DoctorPortal({
  account,
  contract,
  showToast
}) {
  const [patientAddress, setPatientAddress] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const [secretKey, setSecretKey] = useState('MedConsent_2026!Secure');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedRecord, setDecryptedRecord] = useState(null);

  const [showViewer, setShowViewer] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(100);

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('Critical ER Trauma - Patient Unconscious');
  const [triggeringEmergency, setTriggeringEmergency] = useState(false);

  const handleVerifyConsent = async (e) => {
    e.preventDefault();
    if (!contract || !account) {
      showToast('Please connect your MetaMask wallet first', 'error');
      return;
    }
    if (!patientAddress) {
      showToast('Patient Ethereum Address is required', 'error');
      return;
    }

    try {
      setVerifying(true);
      setDecryptedRecord(null);
      const [ hasAccess, ipfsCID, category ] = await contract.verifyConsent(patientAddress, account);

      setVerificationResult({
        hasAccess,
        ipfsCID,
        category: Number(category)
      });

      if (hasAccess) {
        showToast('Verification Successful! Active consent confirmed on-chain.', 'success');
      } else {
        showToast('Access Denied: No active or unexpired consent found.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Verification Error: ' + (err.reason || err.message), 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleDecrypt = async (e) => {
    e.preventDefault();
    if (!verificationResult?.ipfsCID) {
      showToast('No valid IPFS CID found to decrypt', 'error');
      return;
    }
    if (!secretKey) {
      showToast('Please enter the Secret Decryption Key', 'error');
      return;
    }

    try {
      setDecrypting(true);
      const record = await decryptMedicalRecord(verificationResult.ipfsCID, secretKey);
      setDecryptedRecord(record);
      setShowViewer(true);
      showToast('Medical Record Decrypted Successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Decryption Failed: ' + err.message, 'error');
    } finally {
      setDecrypting(false);
    }
  };

  const handleErgencyBreakGlass = async () => {
    if (!contract) return;
    if (!patientAddress || !emergencyReason) {
      showToast('Patient address and explanation reason required', 'error');
      return;
    }
    try {
      setTriggeringEmergency(true);
      const tx = await contract.emergencyBreakGlass(patientAddress, emergencyReason);
      showToast('Submitting ER Emergency Break-Glass to blockchain...', 'info');
      await tx.wait();
      setShowEmergencyModal(false);
      showToast('Emergency Break-Glass Logged on Blockchain!', 'success');
    } catch (err) {
      showToast('Failed to trigger emergency access: ' + (err.reason || err.message), 'error');
    } finally {
      setTriggeringEmergency(false);
    }
  };

  const categoryInfo = RECORD_CATEGORIES[verificationResult?.category || 0];

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
              <Stethoscope className="w-4 h-4" /> Doctor Diagnostic Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Consent Verification & EHR Viewer</h1>
            <p className="text-slate-400 text-sm mt-1">
              Query on-chain smart contract permissions, validate expiry, and decrypt authorized medical records.
            </p>
          </div>
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <ShieldAlert className="w-4 h-4" /> ER Break-Glass Protocol
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-cyan-400" /> 1. Query Patient Consent
          </h2>

          <form onSubmit={handleVerifyConsent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Patient Ethereum Address</label>
              <input
                type="text"
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
                placeholder="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
                className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {verifying ? 'Verifying on Blockchain...' : 'Verify Consent On-Chain'}
            </button>
          </form>

          {verificationResult && (
            <div className={'mt-6 p-4 rounded-xl border ' + (verificationResult.hasAccess ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-red-500/5 border-red-500/30')}>
              <div className="flex items-center justify-between mb-2">
                <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ' + (verificationResult.hasAccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300')}>
                  <ShieldCheck className="w-4 h-4" />
                  {verificationResult.hasAccess ? 'ON-CHAIN CONSENT: ACTIVE' : 'NO ACTIVE CONSENT'}
                </span>
                {verificationResult.hasAccess && (
                  <span className={'px-2 py-0.5 rounded-full text-[11px] font-semibold ' + categoryInfo.bg + ' ' + categoryInfo.text + ' border ' + categoryInfo.border}>
                    {categoryInfo.label}
                  </span>
                )}
              </div>
              {verificationResult.ipfsCID && (
                <div className="mt-2">
                  <p className="text-[11px] text-slate-400">IPFS Record CID:</p>
                  <p className="text-xs font-mono text-cyan-300 truncate">{verificationResult.ipfsCID}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Decryption & View Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Unlock className="w-5 h-5 text-emerald-400" /> 2. Decrypt & View EHR
            </h2>

            <form onSubmit={handleDecrypt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Secret Decryption Key</label>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter authorized secret key"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={decrypting || !verificationResult?.hasAccess}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {decrypting ? 'Decrypting Record...' : 'Decrypt & Open Medical Viewer'}
              </button>
            </form>

            {decryptedRecord && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs font-semibold text-slate-200">{decryptedRecord.fileName || 'Medical Record'}</p>
                  </div>
                  <button
                    onClick={() => setShowViewer(true)}
                    className="text-xs px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View In-App
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. In-App Medical Document & Scan Viewer Modal */}
      {showViewer && decryptedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{decryptedRecord.fileName || 'Decrypted EHR Document'}</h3>
                  <p className="text-[11px] text-cyan-400">Category: {RECORD_CATEGORIES[decryptedRecord.category || 0].label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentZoom(prev => Math.max(50, prev - 25))}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-300 px-1">{currentZoom}%</span>
                <button
                  onClick={() => setCurrentZoom(prev => Math.min(200, prev + 25))}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowViewer(false)}
                  className="p-1.5 rounded-md bg-slate-800/80 text-slate-400 hover:text-red-400 transition-all ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40 space-y-6">
              <div className="p-4.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <h4 className="text-xs font-semibold text-cyan-400 mb-1">Clinical Documentation & Diagnostic Notes</h4>
                <p className="text-xs text-slate-300">{decryptedRecord.notes || 'No clinical notes attached.'}</p>
              </div>

              {decryptedRecord.fileDataBase64 && (
                <div className="text-center">
                  {decryptedRecord.fileMime?.startsWith('image/') ? (
                    <div className="overflow-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <img
                        src={decryptedRecord.fileDataBase64}
                        alt="Medical Scan"
                        className="mx-auto rounded-lg transition-all duration-200"
                        style={{ transform: 'scale(' + (currentZoom / 100) + ')', transformOrigin: 'top center' }}
                      />
                    </div>
                  ) : (
                    <iframe
                      src={decryptedRecord.fileDataBase64}
                      title="Medical PDF"
                      className="w-full h-[50vh] rounded-xl border border-slate-800"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/50">
              {decryptedRecord.fileDataBase64 && (
                <a
                  href={decryptedRecord.fileDataBase64}
                  download={decryptedRecord.fileName || 'medical-record'}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold flex items-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4" /> Download Original
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Emergency Break-Glass Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ER Break-Glass Protocol</h3>
                <p className="text-xs text-red-400">Life-threatening emergency access</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Triggering emergency break-glass emits an immutable on-chain audit event associated with your doctor wallet address for legal and clinical auditing.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Justification Reason</label>
              <textarea
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                rows="3"
                className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleErgencyBreakGlass}
                disabled={triggeringEmergency}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold disabled:opacity-50"
              >
                {triggeringEmergency ? 'Logging On-Chain...' : 'Trigger Break-Glass'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}