import React, { useState, useEffect } from 'react';
import { ShieldCheck, UploadCloud, Key, Clock, Trash2, Lock, FileText, ShieldAlert } from 'lucide-react';
import { encryptMedicalRecord } from '../services/ipfs';
import { RECORD_CATEGORIES } from '../contracts/contractConfig';

export default function PatientPortal({
  account,
  contract,
  contractAddress,
  showToast
}) {
  const [doctorAddress, setDoctorAddress] = useState('');
  const [ipfsCID, setIpfsCID] = useState('');
  const [secretKey, setSecretKey] = useState('MedConsent_2026!Secure');
  const [docType, setDocType] = useState('Lab Report');
  const [selectedCategory, setSelectedCategory] = useState(2);
  const [clinicalNotes, setClinicalNotes] = useState('Patient lab report and blood pressure history.');
  const [selectedFile, setSelectedFile] = useState(null);
  const [duration, setDuration] = useState('86400');

  const [encrypting, setEncrypting] = useState(false);
  const [granting, setGranting] = useState(false);
  const [revokingAddr, setRevokingAddr] = useState(null);
  const [consentsList, setConsentsList] = useState([]);
  const [emergencyLogs, setEmergencyLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const PRESET_DOCTORS = [
    { label: 'Doctor #1 (Cardiology)', addr: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
    { label: 'Doctor #2 (Radiology)', addr: '0x90F79bf6Eb2c4E8a895F1297be8883876E539771' },
    { label: 'Doctor #3 (ER Trauma)', addr: '0x15d34AACe3Fe1efC04ba1e7aB832476429f8E6A1' }
  ];

  useEffect(() => {
    if (account) {
      const stored = localStorage.getItem('med_consents_' + account.toLowerCase());
      if (stored) {
        try {
          setConsentsList(JSON.parse(stored));
        } catch (e) {}
      }
      fetchEmergencyLogs();
    }
  }, [account, contract]);

  const fetchEmergencyLogs = async () => {
    if (!contract || !account) return;
    try {
      setLoadingLogs(true);
      const logs = await contract.getEmergencyAccessLogs(account);
      const formatted = logs.map(l => ({
        doctor: l.doctor,
        timestamp: Number(l.timestamp) * 1000,
        reason: l.reason
      }));
      setEmergencyLogs(formatted);
    } catch (err) {
      console.warn('Failed to load emergency logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const saveConsentsToLocal = (list) => {
    setConsentsList(list);
    if (account) {
      localStorage.setItem('med_consents_' + account.toLowerCase(), JSON.stringify(list));
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!secretKey) {
      showToast('PLEASE ENTER A SECRET KEY', 'error');
      return;
    }
    try {
      setEncrypting(true);
      const result = await encryptMedicalRecord(
        selectedFile,
        docType,
        clinicalNotes,
        secretKey,
        selectedCategory
      );
      setIpfsCID(result.ipfsCID);
      showToast('Record Encrypted & Pinned to IPFS! CID: ' + result.ipfsCID.substring(0, 12) + '...', 'success');
    } catch (err) {
      showToast('Encryption Failed: ' + err.message, 'error');
    } finally {
      setEncrypting(false);
    }
  };

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    if (!contract) {
      showToast('Please connect your MetaMask wallet first', 'error');
      return;
    }
    if (!doctorAddress || !ipfsCID) {
      showToast('Doctor Address and IPFS CID are required', 'error');
      return;
    }

    try {
      setGranting(true);
      const durNum = BigInt(duration);
      const tx = await contract.grantConsent(
        doctorAddress,
        ipfsCID,
        selectedCategory,
        durNum
      );
      showToast('Transaction submitted! Waiting for block confirmation...', 'info');
      await tx.wait();

      const until = Math.floor(Date.now() / 1000) + Number(duration);
      const updated = [
        { doctor: doctorAddress, ipfsCID, category: selectedCategory, validUntil: until, secretKey, docType, isGranted: true },
        ...consentsList.filter(c => c.doctor.toLowerCase() !== doctorAddress.toLowerCase())
      ];
      saveConsentsToLocal(updated);
      showToast('On-Chain Consent Granted Successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to grant consent: ' + (err.reason || err.message), 'error');
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeConsent = async (doctorAddr) => {
    if (!contract) return;
    try {
      setRevokingAddr(doctorAddr);
      const tx = await contract.revokeConsent(doctorAddr);
      showToast('Revoking consent on-chain...', 'info');
      await tx.wait();

      const updated = consentsList.map(c => {
        if (c.doctor.toLowerCase() === doctorAddr.toLowerCase()) {
          return { ...c, isGranted: false };
        }
        return c;
      });
      saveConsentsToLocal(updated);
      showToast('Consent Revoked Successfully!', 'success');
    } catch (err) {
      showToast('Failed to revoke: ' + (err.reason || err.message), 'error');
    } finally {
      setRevokingAddr(null);
    }
  };

  const formatRemainingTime = (until) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = until - now;
    if (diff <= 0) return { label: 'Expired', isExpired: true };
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 24) return { label: Math.floor(h / 24) + 'd ' + (h % 24) + 'h left', isExpired: false };
    if (h > 0) return { label: h + 'h ' + m + 'm left', isExpired: false };
    return { label: m + 'm ' + s + 's left', isExpired: false };
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" /> Patient Control Center
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Patient Consent & Encrypted Vault</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Grant time-bound, categorized consent to doctors with end-to-end AES-GCM 256-bit encryption and IPFS storage.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <Lock className="w-5 h-5 text-cyan-400" />
            <div className="text-xs">
              <p className="text-slate-400 font-medium">Contract Address</p>
              <p className="text-cyan-300 font-mono font-semibold">{contractAddress ? contractAddress.substring(0, 10) + '...' : 'Connecting...'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Encrypt & Upload Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center border border-cyan-500/30">1</span>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-cyan-400" /> Encrypt & Upload to IPFS
              </h2>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Medical Record Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {RECORD_CATEGORIES.map(cat => (
                    <button
                      type="button"
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={'px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ' +
                        (selectedCategory === cat.value
                          ? 'bg-gradient-to-r ' + cat.color + ' text-white border-transparent shadow-md'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700')
                      }
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select File (PDF or Scan Image)</label>
                <div className="border-2 border-dashed border-slate-700/80 hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-950/40">
                  <input type="file" id="medFile" onChange={(e) => setSelectedFile(e.target.files[0])} className="hidden" />
                  <label htmlFor="medFile" className="cursor-pointer block">
                    <FileText className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-semibold text-cyan-300">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-slate-300">Click to browse medical file</p>
                        <p className="text-[11px] text-slate-500 mt-1">Encrypted in browser before IPFS upload</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Secret Decryption Key (AES-GCM 256)</label>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter a strong secret passphrase"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={encrypting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {encrypting ? 'Encrypting & Pinning to IPFS...' : 'Encrypt & Upload to IPFS'}
              </button>
            </form>
          </div>
        </div>

        {/* 2. Grant Consent Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30">2</span>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" /> Grant Consent on Smart Contract
              </h2>
            </div>

            <form onSubmit={handleGrantConsent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor Ethereum Address</label>
                <input
                  type="text"
                  value={doctorAddress}
                  onChange={(e) => setDoctorAddress(e.target.value)}
                  placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  required
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[0.65rem] text-slate-500">Preset Doctors:</span>
                  {PRESET_DOCTORS.map((doc, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setDoctorAddress(doc.addr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-400 hover:bg-slate-700 transition-all"
                    >
                      Doctor #{i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">IPFS Record CID</label>
                <input
                  type="text"
                  value={ipfsCID}
                  onChange={(e) => setIpfsCID(e.target.value)}
                  placeholder="QmXaWrK7mqZU2pNjR1wmAK5y4MvMvPQsmN86t7XY8qPPpX"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Validity Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { l: '1H', v: '3600' },
                    { l: '24H', v: '86400' },
                    { l: '7D', v: '604800' },
                    { l: '30D', v: '2592000' }
                  ].map(item => (
                    <button
                      type="button"
                      key={item.v}
                      onClick={() => setDuration(item.v)}
                      className={'py-1.5 rounded-xl text-xs font-semibold transition-all ' +
                        (duration === item.v
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-slate-900/80 text-slate-400 border border-slate-800')
                      }
                    >
                      {item.l}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={granting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {granting ? 'Signing Transaction...' : 'Sign & Grant Consent On-Chain'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Active Consents Registry Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" /> Active Consents Registry
          </span>
          <span className="text-xs text-slate-400">{consentsList.length} Granted</span>
        </h3>

        {consentsList.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No consents granted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4">Doctor Address</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">IPFS CID</th>
                  <th className="py-3 px-4">Status & Validity</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {consentsList.map((item, idx) => {
                  const remaining = formatRemainingTime(item.validUntil);
                  const isActive = item.isGranted && !remaining.isExpired;
                  const cat = RECORD_CATEGORIES[item.category] || RECORD_CATEGORIES[0];
                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold">
                        {item.doctor.substring(0, 8) + '...' + item.doctor.substring(item.doctor.length - 6)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={'px-2.5 py-1 rounded-full text-[0.65rem] font-semibold border ' + (cat.bg || 'bg-slate-800') + ' ' + (cat.text || 'text-slate-300') + ' ' + (cat.border || 'border-slate-700')}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {item.ipfsCID.substring(0, 10) + '...'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Active ({remaining.label})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                            Revoked / Expired
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isActive && (
                          <button
                            onClick={() => handleRevokeConsent(item.doctor)}
                            disabled={revokingAddr === item.doctor}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {revokingAddr === item.doctor ? 'Revoking...' : 'Revoke'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Emergency Break-Glass Audit Trail (Patient View) */}
      <div className="glass-panel p-6 rounded-2xl border border-red-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-slate-100">Emergency Break-Glass Audit Logs</h3>
          </div>
          <button
            onClick={fetchEmergencyLogs}
            disabled={loadingLogs}
            className="text-xs px-3 py-1 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
          >
            {loadingLogs ? 'Refreshing...' : 'Refresh Logs'}
          </button>
        </div>

        {emergencyLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No emergency break-glass events recorded for your patient address.</p>
        ) : (
          <div className="space-y-2.5">
            {emergencyLogs.map((log, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold text-[10px]">ER EMERGENCY</span>
                    <p className="text-xs font-mono text-slate-200">{log.doctor}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Justification: <span className="text-slate-200 font-medium">{log.reason}</span></p>
                </div>
                <span className="text-[0.65rem] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}