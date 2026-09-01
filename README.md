# Patient Consent Management System on Blockchain

> **A Decentralized, Privacy-Preserving EHR Consent Architecture powered by Ethereum Smart Contracts, AES-GCM-256 Client-Side Cryptography, and IPFS Storage.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22.x-FFF100?style=for-the-badge&logo=hardhat&logoColor=black)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-19.x-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535a0?style=for-the-badge&logo=ethereum&logoColor=white)](https://docs.ethers.org/v6/)
[![IPFS](https://img.shields.io/badge/IPFS-Decentralized_Storage-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white)](https://ipfs.tech/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Core Features](ccore-features)
- [System Architecture](#system-architecture)
- [Smart Contract Specification](#smart-contract-specification)
- [Automated Unit Tests](#automated-unit-tests)
- [Tech Stack](ctech-stack)
- [Quick Start and Local Deployment](#quick-start-and-local-deployment)
- [MetaMask Configuration Guide](#metamask-configuration-guide)
- [User Journey Walkthrough](#user-journey-walkthrough)
- [Security and Privacy Model](#security-and-privacy-model)
- [License](#license)

---

## Executive Summary

Traditional Electronic Health Record (EHR) systems store patient data on centralized databases vulnerable to single-point-of-failure breaches, unauthorized doctor access, and opaque data sharing practices.

The **Patient Consent Management System** restores patient data ownership through:
1. **Self-Sovereign Consent Control**: Patients grant and revoke access permissions via immutable Ethereum smart contracts.:2. **Time-Bound Consent Expiry**: Permissions automatically expire on-chain using block timestamps.
3. **End-to-End Cryptography**: Medical scans, lab results, and clinical notes are encrypted on the patient device using **AES-GCM 256-bit** encryption before being stored on **IPFS**.
4. **Zero Knowledge on Storage**: Storage nodes and unauthorized parties can never read raw health data.

---

## Core Features

| Feature | Description |
| :--- | :--- |
| **On-Chain Consent Registry** | Double mapping registry `consentRegistry[patient][doctor]` tracking active status, expiry, and IPFS CID. |
| **Time-Bound Validity** | Patients choose exact consent duration (1h, 24h, 7d, 30d). Smart contract verifies validity with `block.timestamp <= validUntil`. |
| **Instant One-Click Revocation** | Patients can instantly revoke any doctor permission on-chain before the duration expires. |
| **Client-Side AES-GCM Encryption** | Web Crypto API PBKDF2 key derivation and 256-bit AES encryption ensures no plain-text data leaves the browser. |
| **IPFS Decentralized Vault** | Encrypted payload is pinned to IPFS with deterministic Content Identifiers (CIDs) and Pinata integration. |
| **Doctor Verification Portal** | Healthcare providers verify on-chain permissions in real-time and decrypt clinical files using authorized keys. |
| **Real-Time Blockchain Audit Log** | Live event listeners subscribe to `ConsentGranted` and `ConsentRevoked` contract events. |

---

## System Architecture

```text
               +--------------------------------------------*UQS��P��ԕS�
�KKKKKKKKKKKKKKKKKKKKKJ�KKKKKKKKKKKKKKKKKKKKJ�K��[X��[H
��]�^H��[�ܞ\��[H
QT�Q��H�M�X�]
B���
�KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKJT��T�SH�US�
�ܙ\�[�ܞ\Y�؈	��Q
H�
�KKKKKKKKKKKKKKKKKKKKKJ�KKKKKKKKKKKKKKKKKKKKJ�ˈ�[ܘ[��ۜ�[�
��܋\���Q\�][ۊH���
�KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKJUT�USH�PT��ӕ�P��Q�T��H�
]Y[��ۜ�[����
H�
�KKKKKKKKKKKKKKKKKKKKKJ�KKKKKKKKKKKKKKKKKKKKJ���]Y\�H�\�Y�P�ۜ�[�
]Y[�
HK��]\��Έ\�X��\��
�YK٘[�JH	��Q��
�KKKKKKKKKKKKKKKKKKKKKKJ�KKKKKKKKKKKKKKKKKKKKJ��Ԉ�P��ԕS�
�[Y]\�X��\��	�Xܞ\��[JH�
�KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKJ��KKB�����X\��۝�X��X�Y�X�][ۂ���[H��][ێ��X��[���۝�X���]Y[��ۜ�[�����[��XY�N�
����Y]H����
���U�H�]�ܚΈ
��\�]��[��
ܝMJH��\�XH\��]
��������]H��X�\�\��Y]B���X��ۜ�[����\�ܘ[�Y����Y�[�X�][��X�]�H�ۜ�[��]\Z[��M��[Y[�[���^\�][ۈ[Y\�[\[��X�ۙ��[��\���Q����۝[�Y[�Y�Y\�وH[�ܞ\YYYX�[�X�ܙ�B����X\[�Έ]Y[�Y�\��O���܈Y�\��O��ۜ�[�]Z[X\[��Y�\��O�X\[��Y�\��O��ۜ�[�
JHX�X��ۜ�[��Y�\��N������۝�X�Y]������K�ܘ[��ۜ�[����Y]B��[��[ۈܘ[��ۜ�[�
�Y�\�����܋���[��Y[[ܞH�\���Q�Z[��M��\�][ے[��X�ۙH^\��[��H
��\�ܚ\[ۊ���ܘ[��[YKX��[�X��\������ܘ�܈�X�ܙ�\���Q\�[���\�][ے[��X�ۙ���H
��[Z]ʊ���ۜ�[�ܘ[�Y
\�˜�[�\����܋�\���Q���˝[Y\�[\
��\�][ے[��X�ۙ�X���������]���P�ۜ�[����Y]B��[��[ۈ�]���P�ۜ�[�
Y�\�����܊H^\��[��H
��\�ܚ\[ۊ���[[YYX][H[��[Y]\���܈X��\��\�Z\��[ۋ��H
��[Z]ʊ���ۜ�[��]���Y
\�˜�[�\����܊X
�����ˈ�\�Y�P�ۜ�[����Y]B��[��[ۈ�\�Y�P�ۜ�[�
�Y�\���]Y[��Y�\�����܂�H^\��[�Y]��]\���
���\�X��\����[��Y[[ܞH\���Q
B��H
��\�ܚ\[ۊ����[Y]\�]�ۜ�[�\�ܘ[�Y[����˝[Y\�[\H�[Y[�[���KKB����]]�X]Y[�]\��H\��Z]H�ݙ\���[Y�X�X�H�[Y][ۋ]]ܚ^�][ۈ��[�\�Y\�[�[YK]�]�[�[][][ۜ˂���[�H\��Z]N���\����X��[���\�]\�������\��\�[�
\��[��L	H�ݙ\�Y�JN��^�]Y[��ۜ�[�X[�Y�[Y[��\�[B�\�[Y[���T��H��[\�H�X��\�ٝ[H[�]�HH�[YY�\�ܘ[��ۜ�[���T��H��[[��H]Y[��ܘ[��ۜ�[�[�[Z]�ۜ�[�ܘ[�Y]�[���T��H��[�Z�X�ܘ[�[���ۜ�[��Y�\��
B��\�Y�H�ۜ�[���T��H��[�\�Y�HX�]�H�ۜ�[��܈]]ܚ^�Y��܂��T��H��[[�HX��\���[�]]ܚ^�Y��܂��T��H��[[�HX��\���[��ۜ�[�^\�\�Y�\�\�][ۂ��]���H�ۜ�[���T��H��[[��]Y[���]���H�ۜ�[�[�[Z]�ۜ�[��]���Y]�[���T��H��[�Z�X��]���[���ۜ�[��܈Y�\��
B��\��[��
\�B���KKB����X��X��H
���X\��۝�X�ʊ����Y]H����[��\[[��۝�X�H
�������Z[���[Y]�ܚʊ��\�]��\�]�]�ܚ�U�B�H
���Y[�X��\�J���]\�˚�����H
����۝[���[Y]�ܚʊ���XX�NK�]B�H
���[[�ʊ��Z[�[������\��[ܜ\�H\�Yۈ��[�H
��X�ۜʊ��X�YH�XX��H
��X�[��[^�Y�ܘY�J���T��[�]H��YTB�H
�������\�ܞ\�ܘ\J����X�ܞ\�TH
�����KL�M�
�QT�Q��KL�M�B��KKB����]ZX���\�[���[\�[Y[�������\�\]Z\�]\Hӛ�K���J΋�ۛ�Z�˛ܙ��H
�\��[ۈN܈Y�\�B�H�Y]SX\��J΋��Y][X\�˚[��H�����\�^[��[ۈ[��[Y��KKB������\N��ۙH�\��]ܞB��\���]Y[�P�ۜ�[�SX[�Y�[Y[�T�\�[B���KKB������\���\���[]\�][H��B��[�H\�Z[�[[�H���\�X�ܞH[��[����\����X��[���H[��[��\�]��B���
����N����Y\\�\�Z[�[�[��[�ˈ]�\��H��[]\�][H��Hۈ���L�ˌ��N�MX
�Z[�Q�L���H[��]]���[�Y\�X���[�˂��KKB������\Έ\�H�X\��۝�X���[�H
���X�ۙ\�Z[�[
��[��[����\����X��[���\�]�[��ܚ\��\�K�ڜ�K[�]�ܚ���[������۝�X�\�\��Y�\�ΈQ�����MM��Y�X،ٌ͍̙Lэ����NXL�
���KKB������\��[��XX��X����۝[���[�H
��\�\�Z[�[
��[��[����\�����۝[���H[��[��H�[�]����[�[�\������\�]�
�������[���LM�ʊ�
܈
�������[����
��B����N�[�H�[��[��HHܝ[��]K��ۙ�Y˚��Y��\]Z\�Y���KKB����Y]SX\���ۙ�Y�\�][ۈ�ZYB�����Y\�]��[�]�ܚ��Y]SX\�K��X��H�]�ܚ����ۈ[�Y]SX\��O�
��Y�]�ܚʊ�O�
��YH�]�ܚ�X[�X[J�����[�\�H����[��]Z[΂�H
���]�ܚ��[YJ���\�]��[���H
���]���T�
������L�ˌ��N�MX�H
���Z[�Q
����L����H
���\��[��H�[X��
���U�ˈ�X��
���]�J��������[\ܝ\�X���[�[\ܝH�[\HX���[��\�[��Z\��]�]H�^\΂����HX���[�Y�\���]�]H�^H��KKH�KKH�KKH�
��]Y[�
X���[��
J����S��MLXXY����M�P��̍�Xٙ���L����X�M��X��XLM�L͘�MM������M�X؍�ؙYYY��YM�ؙ������
����܈
X���[��JJ���NM�M��LNL���LL��X�LLM���P�NX͎NMYNNN�M�MXLM���ML�Y�YN�YN��NL���؍����L��KKB����\�\���\��^H�[���Y������K�]Y[��ܚٛ��
ܘ[��ۜ�[�[�\�Y�X�ܙ
B�K��ۛ�X�Y]SX\��\�[��H
��]Y[�X���[�
�������[X�H�[�X�[�[H
��\ܝX��\�[��[�H[�H
��[�ܞ\	�\�Y�T�ʊ��\���ˈ[�\�H�\��H
���Xܙ]Xܞ\[ۈ�^J������X��
��[�ܞ\	�\�Y�T�ʊ�HH[�ܞ\Y^[�Y\�\�YY[��[�\�]\�H[�\]YHT���Q
[K���
K��K�[�H
��ܘ[��ۜ�[�
���\�[�\�H
����܈]\�][HY�\�ʊ�[��[X�H
���[Y]H\�][ۊ��
K�ˈ��\��K�����X��
���Yۈ	�ܘ[��ۜ�[�ۋP�Z[���[��ۙ�\�HHY]SX\���[��X�[ۋ��ˈH�ۜ�[�\�X�]�H[[YYX][H�]H]�H��[��ۈ[�[�\�
��]�H�ۜ�[��X�J������������܈�ܚٛ��
�\�Y�HX��\��[��Y]�R�B�K���]�Y]SX\��X���[��H
����܈X���[�
�������]�Y�]H�H
����܈ܝ[
��X���ˈ[�\�H]Y[�Y�\��[��X��
���\�Y�H�ۜ�[�ۋP�Z[������Y�]]ܚ^�Y[��][�H�[Y]H�[���H�Y�H[[Z[�]\�
��ӋP�RS��Ӕ�S��T�Q�QQ�P�U�J��[��]�Y]�\�HT���Q��K�[�\�HXܞ\[ۈ�^H��Y]��[�X�[��\��]�Y]���[��܈�ۛ�YHܚY�[�[�[K������ˈ�]���][ۈ�ܚٛ�K�[�H]Y[�ܝ[�X��
���]���J��ۈ[�HX�]�H[��H[�H�ۜ�[��Y�\��HX�K�����ۙ�\�HH�[��X�[ۈ[�Y]SX\�˂�ˈ�]\�H�\�Y�X�][ۈ][\��HH��܈�[[[YYX][H�]\��
��X��\��[�YY�H�X\��۝�X�
������KKB�����X�\�]H[��]�X�H[�[��H
���\��Z[�U^ۈ�Z[������\��ۘ[HY[�Y�XX�HX[[��ܛX][ۈ
JH܈[�[�ܞ\Y]H\�]�\�ܚ][��H�����Z[�܈T�˂�H
��ܞ\�ܘ\X�[�\[�[��J���]H[�ܞ\[ۈ\�[�\[�[�و�ۜ�[��\���\��ۛH�\��وHXܞ\[ۈ�^H�[��Y]�YYX�[��[Y[�˂�H
��[�]�[�]^�][ۊ����\��XY�\���[Y][ۜ�[���X�[�Y�\��ۜ��Z[��[��X\��۝�X��[��[ۜ˂�H
��]Y]�Z[
���]�\�H]]ܚ^�][ۈ�]H�[��][ۈ��X�\�[�[[]]X�H��[��H�]�����[X�\��[�\�[�[Y\�[\���KKB����X�[��B��\��ڙX�\��[�\��\��H[�X�[��Y[�\�H
��RUX�[��J������Z[�H՚\��HܙYH�YXWJ΋���]X����K՚\��TܙYU�YXJK�