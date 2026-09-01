import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Navbar from './components/Navbar';
import PatientPortal from './components/PatientPortal';
import DoctorPortal from './components/DoctorPortal';
import AuditLog from './components/AuditLog';
import { PATIENT_CONSENT_ABI, DEFAULT_CONTRACT_ADDRESS } from './contracts/contractConfig';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('patient');
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [connecting, setConnecting] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (window.ethereum) {
      checkExistingConnection();
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [contractAddress]);

  const checkExistingConnection = async () => {
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.listAccounts();
      if (accounts.length > 0) {
        setupConnection(browserProvider, accounts[0].address);
      }
    } catch (e) {
      console.warn('Auto connect check error:', e);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setupConnection(browserProvider, accounts[0]);
    }
  };


  const setupConnection = async (browserProvider, userAddress) => {
    try {
      const userSigner = await browserProvider.getSigner();
      const bal = await browserProvider.getBalance(userAddress);
      const net = await browserProvider.getNetwork();

      const patientConsentContract = new ethers.Contract(
        contractAddress,
        PATIENT_CONSENT_ABI,
        userSigner
      );

      setProvider(browserProvider);
      setSigner(userSigner);
      setAccount(userAddress);
      setBalance(ethers.formatEther(bal));
      setNetwork(net.name === 'unknown' ? ('Localhost (' + net.chainId + ')') : net.name);
      setContract(patientConsentContract);

      setupEventListeners(patientConsentContract);
    } catch (err) {
      console.error('Setup connection failed:', err);
    }
  };


  const setupEventListeners = (contractInstance) => {
    try {
      contractInstance.on('ConsentGranted', (patient, doctor, ipfsCID, validUntil, event) => {
        addAuditLog({
          txHash: event?.log?.transactionHash || '',
          type: 'grant',
          message: 'Consent granted by ' + patient.substring(0, 6) + '... to ' + doctor.substring(0, 6) + '...',
          timestamp: Date.now(),
        });
      });


      contractInstance.on('ConsentRevoked', (patient, doctor, event) => {
        addAuditLog({
          txHash: event?.log?.transactionHash || '',
          type: 'revoke',
          message: 'Consent revoked by ' + patient.substring(0, 6) + '... for doctor ' + doctor.substring(0, 6) + '...',
          timestamp: Date.now(),
        });
      });
    } catch (e) {
      console.warn('Auto connect event listener fallback:', e);
    }
  };


  const addAuditLog = (entry) => {
    setAuditLogs((prev) => [entry, ...prev.slice(0, 20)]);
  };


  const handleConnect = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not detected. Please install MetaMask browser extension.');
      return;
    }
    setConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        await setupConnection(browserProvider, accounts[0]);
        showToast('MetaMask Wallet Connected Successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect wallet: ' + (err.reason || err.message));
    } finally {
      setConnecting(false);
    }
  };


  const handleDisconnect = () => {
    setAccount(null);
    setBalance('0');
    setNetwork(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    showToast('Wallet Disconnected.');
  };


  const showToast = (msg, txHash = null) => {
    setToastMessage({ text: msg, txHash });
    if (txHash) {
      addAuditLog({
        txHash,
        type: msg.lowercase().includes('revoke') ? 'revoke' : 'grant',
        message: msg,
        timestamp: Date.now(),
      });
    }
    setTimeout(() => setToastMessage(null), 5000);
  };


  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl glass-panel border-emerald-500/40 bg-slate-900/95 shadow-2xl flex items-center gap-3 animate-slideIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-slate-100">{toastMessage.text}</p>
            {toastMessage.txHash && (
              <p className="font-mono text-[10px] text-cyan-400 mt-0.5 truncate max-w-xs">
                TX: {toastMessage.txHash}
              </p>
            )}
          </div>
        </div>
      )}


      <Navbar
        account={account}
        balance={balance}
        network={network}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        connecting={connecting}
      />


      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {!account && (
          <div className="glass-panel p-5 rounded-2xl border-cyan-500/30 bg-cyan-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Connect Web3 Wallet to Interact</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Connect MetaMask on Hardhat Localhost (Port 8545) or Sepolia testnet to sign consent transactions.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 wrink-0"
            >
              {connecting ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          </div>
        )}


        {activeTab === 'patient' ? (
          <PatientPortal
            contract={contract}
            account={account}
            onTransactionSuccess={showToast}
            contractAddress={contractAddress}
          />
        ) : (
          <DoctorPortal
            contract={contract}
            account={account}
            contractAddress={contractAddress}
          />
        )}


        <AuditLog logs={auditLogs} />
      </main>


      <footer className="border-t border-slate-850 bg-slate-950/80 py-6 px-4 text-center text-x{ text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 MedConsent Web3 — Patient Consent Management System on Blockchain</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Solidity 0.8.20</span>
            <span>₇</span>
            <span>IPFS AES-GCM Encrypted</span>
            <span>•</span>
            <span>Hardhat / Ethers.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}