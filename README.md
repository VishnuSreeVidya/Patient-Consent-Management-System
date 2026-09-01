# 🏥 Patient Consent Management System on Blockchain (Web3 + IPFS)

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22.x-FFF100?style=for-the-badge&logo=hardhat&logoColor=black)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-19.x-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535a0?style=for-the-badge&logo=ethereum&logoColor=white)](https://docs.ethers.org/v6/)
[![IPFS](https://img.shields.io/badge/IPFS-Decentralized_Storage-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white)](https://ipfs.tech/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An enterprise-grade, decentralized **Patient Consent Management System** built on Ethereum blockchain. The platform provides patients with complete autonomy over their Electronic Health Records (EHR) through **granular, time-bound, and revocable smart contracts**, combined with **AES-GCM client-side encryption** and **IPFS decentralized storage**

---

## 🌝 Key Highlights

- ***🔔 Decentralized Consent Registry**: Smart contract (`PatientConsent.soll) tracks access permissions with zero central authority or single point of failure.
- **⏱� Time-Bound Access Permissions**: Patients specify exact validity durations (e.g., 1 hour, 24 hours, 7 days, 30 days). Access automatically expires on-chain via block timestamps (`block.timestamp <= validUntil`).
- **�� Instant Access Revocation**: Patients can immediately revoke a doctor's access with a single on-chain transaction.
- **🛡��� Client-Side AES-GCM 256-bit Encryption**: Medical files (PDFs, MRI scans, lab reports) and clinical notes are encrypted *in the browser* before being sent to IPFS. Storage providers never see unencrypted data.
- **📦 IPFS & Pinata Decentralized Storage**: Records are assigned immutable Content Identifiers (CIDs) and pinned to IPFS.
- **🪹 Dedicated Doctor Diagnostic Portal**: Doctors query `verifyConsent(patient, doctor)` to validate on-chain permissions and view/decrypt medical records with the authorized key.
- **📜 Live Audit Stream**: Real-time contract event listeners subscribe to `ConsentGranted` and `ConsentRevoked` events, displaying live transaction hashes.
- **🚁 100% Automated Test Coverage**: 8 unit tests in Hardhat verifying deployment, authorization, expiration, and error handling.

---

## 🏗 System Architecture

```
    +-------------------+               +-------------------+-
    |   Patient Portal   |               |   Doctor Portal    |
    | (MetaMask Account) |               | (MetaMask Account) |
    +---------+---------+               +---------+---------+
              |                                    |
  1. Encrypt Record (QES-GCM)          4. Query verifyConsent(patient, doctor)
  2. Pin to IPFS (Get CID)                        |
  3. Call grantConsent(doctor, CID, time)         v
             |                          +----------------------+-
             +------------------------> | PatientConsent.sol   |
                                     | Smart Contract       |
                                     +----------+-----------+
                                                |
                                    5. Returns: hasAccess & CID
                                                |
                                                v
                                     +----------------------+
                                     | IPFS / Pinata Vault  |
                                     | (Encrypted Payload)  |
                                     +----------+-----------+
                                                |
                                    6. Decrypt with Secret Key
                                                v
                                     [ Decrypted EHR View ]
```

---

## �n Smart Contract Overview (`PatientConsent.soll)

The smart contract is written in Solidity `0.8.20` and deployed on Ethereum / Hardhat EVM.


### Core Data Structure
```solidity
struct Consent {
    bool isGranted;       // Active consent flag
    uint256 validUntil;   // Unix timestamp for expiry
    string ipfsCID;       // IPFS CID of encrypted record
}
```

### Functions
|| Function | Visibility | Description |
~~~|~~~~~~~~|~~~~~~~~~~~|~~~~~~~~~~~|
| `grantConsent(address _doctor, string _ipfsCID, uint256 _durationInSeconds)` | `external` | Grants time-bound access to a doctor and stores the IPFS CID. |
| `revokeConsent(address _doctor)` | `external` | Revokes doctor access immediately. |
| `verifyConsent(address _patient, address _doctor)` | `external view` | Returns `(bool hasAccess, string memory ipfsCID)` validating that consent is active and unexpired. |

### Contract Events
- `event ConsentGranted(address indexed patient, address indexed doctor, string ipfsCID, uint256 validUntil);`
- `event ConsentRevoked(address indexed patient, address indexed doctor);`

---

## 🚉 Automated Unit Tests

The repository includes a full automated test suite using **Hardhat Toolbox** and **Ethers.js**.

Run tests from the `backend/` directory:
```bash
cd backend
npx hardhat test
```

Test Suite Output (8/8 Passing):
```
  PatientConsent Management System
    Deployment
      ✑ Should deploy successfully and have a valid address
    Grant Consent
      ✑ Should allow a patient to grant consent and emit ConsentGranted event
      ✑ Should reject granting consent to address(0)
    Verify Consent
      ✑ Should verify active consent for authorized doctor
      ✑ Should deny access to unauthorized doctor
      ✑ Should deny access when consent expires after duration
    Revoke Consent
      ✑ Should allow patient to revoke consent and emit ConsentRevoked event
      ✑ Should reject revoking consent for address(0)

  8 passing (1s)
```

---

## 💻 Tech Stack

- **Smart Contracts**: Solidity `0.8.20`, OpenZeppelin Contracts
- **Blockchain Framework**: Hardhat 2.x, Hardhat Toolbox
- **Client Libraries**: Ethers.js v6
- **Frontend UI**: React 19, Vite, Tailwind CSS v4, Lucide React
- **Cryptography**: Web Crypto API (`PBKDF2` + `AES-GCM-256`)
- **Storage**: IPFS & Pinata Cloud API

---

## 🛀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MetaMask](https://metamask.io/) browser extension

---

### 1. Clone the Repository
```bash
git clone https://github.com/VishnuSreeVidya/Patient-Consent-Management-System.git
cd Patient-Consent-Management-System
```

---

### 2. Setup & Deploy Backend (Blockchain)

```bash
cd backend
npm install
```

First, start the local Ethereum node (port 8545):
```bash
Z������ɑ��Ё����)���(��-����ѡ�́ѕɵ�����х��������%Ё��չ���́�����ԁQ=4�Y4�����������̀���ѕ�Ё����չ�̤��()�����͵��Ё����Ʌ�ЁѼ��������������������܁ѕɵ�������)�����͠)����������)������ɑ��Ё�ո�͍ɥ��̽�����乍�̀�����ݽɬ����������)���(�����啐�����Ʌ�Ё���ɕ��聀����������ᅙ�����ݘ��ɐ����ɘ�������̀�((���((����̸�M�������Mх�Ёɽ�ѕ��()�����͠)�������ɽ�ѕ��)�������х��)�����ո����)���()=������ȁ�ɽ�͕ȁ�Ѐ�������輽�������������̀�����ȁ������������������((���((����~�ā������ɥ���5�х5�ͬ���ȁ1�����Q��ѥ��((ĸ�=����5�х5�ͬ���ѕ�ͥ�����������9��ݽɬ��ɽ���ݸ��������������ѽ�����ݽɬ���(�������9��ݽɬ�9������!�ɑ��Ё1��������(�������9�܁IA�UI0��聁����輼��ܸ���������Հ(������������%��聀����܀�A���̥�(���������ɕ���M嵉����聁Q!�(ȸ�%����Ё!�ɑ��Ёѕ�Ё����չ�́��Ѽ�5�х5�ͬ��ͥ���ѡ��ȁ�ɥمє������(����������չЀ����A�ѥ��Ф��聀�ᅌ���щ�����ݔ�ى�фوѐ��ᙘ��щ�����ፉ��Օ������ѐ݉�јə����(����������չЀ�Ā���ѽȤ��聀�������Ք����݄Մ������٘������呌��ّ����݄���ɘ���͈و�������((���((����~NX�Mѕ����Mѕ��]���ѡɽ՝�((����́��A�ѥ����(ĸ������Ё5�х5�ͬ�ݥѠ���A�ѥ��Ё���չШ�������A���Ņ�������م������卙������ـ��(ȸ�M����Ё����������������A�͍���������������͕Ё����M��ɕЁ�����ѥ���-�䨨�(̸�������������Ѐ��U������Ѽ�%AL��������%AL���ѕ�Ё%��%���́����Ʌѕ��(и��ѕȁѡ������ѽȝ́ѡ�ɕմ���ɕ�̨������͕���Ёم�����䁑�Ʌѥ����������Ё!���̤�(Ը��������M������Ʌ�Ё��͕�Ё=����������������ɴ��Ʌ�ͅ�ѥ������5�х5�ͬ�(ظ�Q������͕�Ё������́���ѡ�����ѥٔ���͕��̨��х����ݥѠ�����ٔ�����Ʌѥ�����չё�ݸ��������х�Ѐ��I�ٽ��������ѽ��((����́����ѽ��(ĸ�Mݥэ��5�х5�ͬ��ȁ������ЁݥѠ�����ѽȁ���չШ�����������������ɑ�����ݐ�ň������ݑ���ᘤ�(ȸ�Mݥэ��Ѽ�ѡ������ѽȁA��х����х��(̸��ѕȁѡ����ѥ��Н́���ɕ�́������������Y�ɥ����͕�Ё=���������(и�%��ٕɥ������ѡ����ѥٔ�%��́��э������ѕȁѡ��͕�ɕЁ���Ѽ�������Ё�����ɕ٥�ܽ��ݹ�����ѡ����ѥ��Н́��������������((���((����~RH�M���ɥ�䀘�Aɥم������ɕ�((����9��I�܁!���Ѡ��ф�=���������=��䁍���ѽ�Ʌ�������͡�̀�%AL�%̤�����ѥ���х��́�ɔ��ѽɕ�����ѡ�ɕմ�(����i�ɼ�-��ݱ�����MѽɅ�����I���ɑ́�ѽɕ�����%AL��ɔ�L�4�������ѕ�쁍���ɽ��͕���ѽɅ�������́�����Ё������Ё����̸(����i�ɼ���ɕ�́Y�����ѥ�����I�����́��م�������ѽȁ���ɕ�͕̀�����ɕ�̠�����(����Ց�х������%���х�����������ɵ��ͥ����Ʌ��́����ɕٽ��ѥ��́���Ё����������ٕ��́��ȁ�ձ��������������Ʌ������((���((����~N�1����͔)���ɥ��ѕ��չ��ȁѡ����5%P�1����͔���(