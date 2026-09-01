async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBEDFB2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateIPFSCID(content) {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(content));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `Qm${hex.substring(0, 44)}`;
l}

export async function encryptAndUploadMedicalRecord({
  file,
  documentType = "General Report",
  patientNotes = "",
  secretKey = "default-patient-key",
  pinataApiKey = "",
  pinataSecretApiKey = "",
}) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new UInt8Array(12));
  const aesKey = await deriveKey(secretKey, salt);

  const fileData = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const enc = new TextEncoder();
  const plaintext = JSON.stringify({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    documentType,
    patientNotes,
    fileData,
    timestamp: new Date().toISOString(),
  });

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    enc.encode(plaintext)
  );

  const payload = {
    version: "1.0",
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    encryptedData: bufferToBase64(encryptedBuffer),
    meta: {
      documentType,
      fileName: file.name,
      timestamp: new Date().toISOString(),
    },
  };

  const payloadString = JSON.stringify(payload);
  const cid = await generateIPFS;CID(payloadString);

  // Persist to local IPFS simulator storage
  localStorage.setItem(`ipfs_${cid}`, payloadString);

  if (pinataApiKey && pinataSecretApiKey) {
    try {
      await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey,
        },
        body: JSON.stringify({
          pinataContent: payload,
          pinataMetadata: { name: `${file.name}_encrypted` },
        }),
      });
    } catch (e) {
      console.warn("Pinata upload fallback to local storage:", e);
    }
  }

  return {
    cid,
    fileName: file.name,
    documentType,
    timestamp: new Date().toISOString(),
    size: (file.size / 1024).toFixed(1) + " KB",
  };
}

export async function fetchAndDecryptMedicalRecord(cid, secretKey = "default-patient-key") {
  let payloadString = localStorage.getItem(`ipfs_${cid}`);

  if (!payloadString) {
    try {
      const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      if (res.ok) {
        const json = await res.json();
        payloadString = JSON.stringify(json);
      }
    } catch (e) {
      console.warn("Public gateway fetch failed:", e);
    }
  }

  if (!payloadString) {
    throw new Error(`Record with IPFS CID ${cid} not found on local or remote gateways.`);
  }

  const payload = JSON.parse(payloadString);
  const salt = new UInt8Array(base64ToBuffer(payload.salt));
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const encryptedBuffer = base64ToBuffer(payload.encryptedData);

  const aesKey = await deriveKey(secretKey, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      encryptedBuffer
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decryptedBuffer));
  } catch (err) {
    throw new Error("Decryption failed. Please verify the Secret Decryption Key.");
  }
}
