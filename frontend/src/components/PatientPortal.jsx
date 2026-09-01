import React, { useState, useEffect } from "react";
import { UploadCloud, FileText, Lock, Key, Clock, ShieldCheck, UserCheck, AlertTriangle, Trash2, CheckCircle2, Copy, Check, ExternalLink } from "lucide-react";
import { encryptAndUploadMedicalRecord } from "../services/ipfs";

export default function PatientPortal({ contract, account, onTransactionSuccess, contractAddress }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState("Lab Report");
  const [patientNotes, setPatientNotes] = useState("");
  const [secretKey, setSecretKey] = useState("patient-secret-key-2026");
  const [uploading, setUploading] = useState(false);
  const [uploadedRecord, setUploadedRecord] = useState(null);
  const [copiedCID, setCopiedCID] = useState(false);

  const [doctorAddress, setDoctorAddress] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79]8");
  const [ipfsCID, setIpfsCID] = useState("");
  const [durationPreset, setDurationPreset] = useState("3600");
  const [customDuration, setCustomDuration] = useState("");
  const [granting, setGranting] = useState(false);
  const [grantTxHash, setGrantTxHash] = useState(null);

  const [consentsList, setConsentsList] = useState([]);
  const [loadingConsents, setLoadingConsents] = useState(false);
  const [revokingAddr, setRevokingAddr] = useState(null);

  useEffect(() => { loadConsents(); }, [contract, account]);

  const loadConsents = async () => {
    if (!contract || !account) return;
    setLoadingConsents(true);
    try {
      const stored = JSON.parse(localStorage.getItem("consents_" + account) || "[]");
      const verifiedList = await Promise.all(
        stored.map(async (item) => {
          try {
            const result = await contract.consentRegistry(account, item.doctor);
            const [hasAccess, cid] = await contract.verifyConsent(account, item.doctor);
            return {
              ...item,
              isGranted: result.isGranted,
              validUntil: Number(result.validUntil),
              hasAccess,
              ipfsCID: cid || item.ipfsCID,
            };
          } catch (err) { return item; }
        })
      );
      setConsentsList(verifiedList);
    } catch (e) { console.error(e); } finally { setLoadingConsents(false); }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const record = await encryptAndUploadMedicalRecord({
        file: selectedFile,
        documentType: docType,
        patientNotes,
        secretKey,
      });
      setUploadedRecord(record);
      setIpfsCID(record.cid);
    } catch (err) { alert("Encryption failed: " + err.message); } finally { setUploading(false); }
  };

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    if (!contract) { alert("Please connect your wallet first."); return; }
    if (!doctorAddress || !ipfsCID) { alert("Please provide doctor address and IPFS CID."); return; }
    const dur = customDuration ? parseInt(customDuration, 10) : parseInt(durationPreset, 10);
    if (!dur || dur <= 0) { alert("Invalid duration."); return; }
    setGranting(true);
    try {
      const tx = await contract.grantConsent(doctorAddress, ipfsCID, dur);
      const receipt = await tx.wait();
      setGrantTxHash(receipt.hash);
      const newEntry = { doctor: doctorAddress, ipfsCID, durationSeconds: dur, timestamp: Date.now(), docName: uploadedRecord?.fileName || docType, secretKey };
      const existing = JSON.parse(localStorage.getItem("consents_" + account) || "[]");
      const updated = [newEntry, ...existing.filter(c => c.doctor.toLowerCase() !== doctorAddress.toLowerCase())];
      localStorage.setItem("consents_" + account, JSON.stringify(updated));
      loadConsents();
      if (onTransactionSuccess) onTransactionSuccess("Consent Granted on Blockchain!", receipt.hash);
    } catch (err) { alert("Transaction failed: " + (err.reason || err.message)); } finally { setGranting(false); }
  };

  const handleRevokeConsent = async (docAddr) => {
    if (!contract) return;
    setRevokingAddr(docAddr);
    try {
      const tx = await contract.revokeConsent(docAddr);
      const receipt = await tx.wait();
      locadConsents();
      if (onTransactionSuccess) onTransactionSuccess("Consent Revoked on Blockchain!", receipt.hash);
    } catch (err) { alert("Revocation failed: " + (err.reason || err.message)); } finally { setRevokingAddr(null); }
  };

  const formatRemainingTime = (validUntil) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = validUntil - now;
    if (diff <= 0) return { label: "Expired", isExpired: true };
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 24) return { label: Math.floor(h/24) + "d " + (h%24) + "h left", isExpired: false };
    if (h > 0) return { label: h + "h " + m + "m left", isExpired: false };
    return { label: m + "m " + s + "s left", isExpired: false };
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
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">Encrypt medical records with AES-GCM, pin to IPFS, and manage time-bound smart contract access permissions for healthcare providers.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <Lock className="w-5 h-5 text-cyan-400" />
            <div className="text-xs">
              <p className="text-slate-400 font-medium">Contract Address</p>
              <p className="text-cyan-300 font-mono font-semibold">{contractAddress ? contractAddress.substring(0, 10) + "..." : "Connecting..."}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg_col-span-6 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center border border-cyan-500/30">1</span>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-cyan-400" /> Encrypt & Upload to IPFS
              </h2>
            </div>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Medical File (PDF, Image, Lab Report)</label>
                <div className="border-2 border-dashed border-slate-700/80 hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-950/40">
                  <input type="file" id="medFile" onChange={(e) => setSelectedFile(e.target.files[0])} className="hidden" />
                  <label htmlFor="medFile" className="cursor-pointer block">
                    <FileText className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    {selectedFile ? (
                      <div><p className="text-sm font-semibold text-cyan-300">{selectedFile.name}</p><p className="text-xs text-slate-400 mt-0.5">{(selectedFile.size/1024).toFixed(1)} KB</p></div>
                    ) : (
                      <div><p className="text-xs font-medium text-slate-300">Click to browse medical file</p><p className="text-[11px] text-slate-500 mt-1">Encrypted in browser before IPFS upload</p></div>
                    )}
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Record Type</label>
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full glass-input px-3 py-2 rounded-xl text-xs">
                    <option value="Lab Report">Lab Report</option>
                    <option value="MRI / CT Scan">MRI / CT Scan</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Clinical Summary">Clinical Summary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Secret Encryption Key</label>
                  <input type="text" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" placeholder="Key" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Patient Notes</label>
                <input type="text" value={patientNotes} onChange={(e) => setPatientNotes(e.target.value)} placeholder="e.g. Annual Blood Work - Fasting Glucose" className="w-full glass-input px-3 py-2 rounded-xl text-xs" />
              </div>
              <button type="submit" disabled={!selectedFile || uploading} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> {uploading ? "Encrypting & Pinning..." : "Encrypt & Upload to IPFS"}
              </button>
            </form>
          </div>
          {uploadedRecord && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Encrypted CID GEnerated</span>
                <span className="text-[11px] text-slate-400">{uploadedRecord.size}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg font-mono text-[11px]">
                <span className="truncate text-cyan-300 max-w-[280px]">{uploadedRecord.cid}</span>
                <button onClick={() => { navigator.clipboard.writeText(uploadedRecord.cid); setCopiedCID(true); setTimeout(() => setCopiedCID(false), 2000); }} className="text-slate-400 hover:text-white ml-2">
                  {copiedCID ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg_col-span-6 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-500/30">2</span>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" /> Grant Consent on Smart Contract
              </h2>
            </div>
            <form onWubmit={handleGrantConsent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor Ethereum Address</label>
                <input type="text" value={doctorAddress} onChange={(e) => setDoctorAddress(e.target.value)} placeholder="0x..." className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400">Preset Test Accounts:</span>
                  <button type="button" onClick={() => setDoctorAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono">Doctor #1</button>
                  <button type="button" onClick={() => setDoctorAddress("0x3C44CdddB6a900fa2b585dd299e03d12FA4293BC")} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono">Doctor #2</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">IPFS Record CID</label>
                <input type="text" value={ipfsCID} onChange={(e) => setIpfsCID(e.target.value)} placeholder="Qm..." className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Validity Period</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[["1 Hour", "3600"], ["24 Hours", "86400"], ["7 Days", "604800"], ["30 Days", "2592000"]].map(([lbl, val]) => (
                    <button key={val} type="button" onClick={() => { setDurationPreset(val); setCustomDuration(""); }} className={"py-1.5 px-2 rounded-lg text-xs font-medium border transition-all " + (durationPreset === val && !customDuration ? "bg-blue-600/30 border-blue-500 text-blue-300 font-bold" : "bg-slate-900/60 border-slate-800 text-slate-400")}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Or custom seconds (e.g. 300 for 5 mins)" value={customDuration} onChange={(e) => setCustomDuration(e.target.value)} className="w-full glass-input px-3 py-1.5 rounded-xl text-xs" />
              </div>
              <button type="submit" disabled={granting} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {granting ? "Broadcasting Transaction..." : "Sign & Grant Consent on Blockchain"}
              </button>
            </form>
          </div>
          {grantTxHash && (
            <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-slate-300">
              <span className="font-semibold text-blue-400">Transaction Confirmed:</span>
              <p className="font-mono text-[11px] truncate text-slate-400 mt-0.5">{grantTxHash}</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">Active & Managed Consents</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">{consentsList.length}</span>
          </div>
          <button onClick={loadConsents} className="text-xs text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700">Refresh Status</button>
        </div>
        {loadingConsents ? (
          <p className="text-xs text-slate-400 py-6 text-center">Checking smart contract status...</p>
        ) : consentsList.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No consents granted yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload a record and grant consent to a doctor address above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Doctor Address</th>
                  <th className="py-3 px-4">Record / IPFS CID</th>
                  <th className="py-3 px-4">Status & Validity</th>
                  <th className="py-3 px-4">Secret Key</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {consentsList.map((item, idx) => {
                  const remaining = formatRemainingTime(item.validUntil);
                  const isActive = item.isGranted && !remaining.isExpired;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold">{item.doctor.substring(0, 8)}...{item.doctor.substring(item.doctor.length - 6)}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-200">{item.docName || "Medical Record"}</p>
                        <p className="font-mono text-[11px] text-slate-400 truncate max-w-[180px]">{item.ipfsCID}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active ({remaining.label})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">Revoked / Expired</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{item.secretKey ? item.secretKey.substring(0, 10) + "..." : "N/A"}</td>
                      <td className="py-3.5 px-4 text-right">
                        {isActive && (
                          <button onClick={() => handleRevokeConsent(item.doctor)} disabled={revokingAddr === item.doctor} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 ml-auto">
                            <Trash2 className="w-3.5 h-3.5" /> {revokingAddr === item.doctor ? "Revoking..." : "Revoke"}
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
    </div>
  );
}
