/**
 * IPFS & AES-GCM Cryptography Service
 */

export async function generateIPFSCID(dataString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return 'Qm' + hex.substring(0, 42);
}

export async function encryptMedicalRecord(file, docType, notes, secretKey, category = 0) {
  return new Promise(async (resolve, reject) => {
    try {
      let fileDataBase64 = null;
      let fileName = null;
      let fileMime = null;
      let fileSize = 0;

      if (file) {
        fileName = file.name;
        fileMime = file.type || 'application/octet-stream';
        fileSize = file.size;
        fileDataBase64 = await readFileBase64(file);
      }

      const rawPayload = JSON.stringify({
        docType: docType || 'General EHR',
        category,
        notes: notes || '',
        fileName,
        fileMime,
        fileSize,
        fileDataBase64,
        timestamp: Date.now()
      });

      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretKey),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      const aesKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encoder.encode(rawPayload)
      );

      const encryptedPackage = {
        crypto: 'AES-GCM',
        iv: Array.from(iv),
        salt: Array.from(salt),
        data: Array.from(new Uint8Array(encryptedBuffer)),
        docType,
        category,
        fileName
      };

      const packageString = JSON.stringify(encryptedPackage);
      const ipfsCID = await generateIPFSCID(packageString);

      localStorage.setItem('ipfs_' + ipfsCID, packageString);

      resolve({
        ipfsCID,
        packageString,
        category,
        fileName,
        size: packageString.length
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function decryptMedicalRecord(ipfsCID, secretKey) {
  try {
    const packageString = localStorage.getItem('ipfs_' + ipfsCID);
    if (!packageString) {
      throw new Error('Record not found in IPFS vault. CID may be invalid or unpinned.');
    }

    const pkg = JSON.parse(packageString);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const salt = new Uint8Array(pkg.salt);
    const iv = new Uint8Array(pkg.iv);
    const encryptedData = new Uint8Array(pkg.data);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encryptedData
    );

    const rawString = decoder.decode(decryptedBuffer);
    return JSON.parse(rawString);
  } catch (err) {
    throw new Error('Decryption failed. Please check your Secret Key. Error: ' + err.message);
  }
}

function readFileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
