
# 🏛️ Blockchain Land Registry — Ethereum DApp

A complete blockchain-based land registry system built on Ethereum using Solidity smart contracts and Ganache for local development.

---

## 🛠️ Prerequisites — Install These First

1. **Node.js** (v18+) → https://nodejs.org
2. **Ganache** → https://trufflesuite.com/ganache/
3. **MetaMask** (optional, for browser wallet demo) → https://metamask.io

---

## 🚀 Setup & Run (Step-by-Step)

### Step 1 — Install dependencies

```bash
cd land-registry
npm install
```

Also install the Solidity compiler:
```bash
npm install -g solc
```
or use npx (already used in the compile script).

---

### Step 2 — Start Ganache

Open **Ganache** application and:
- Click **"Quickstart"** (Ethereum)
- Note the RPC Server URL (default: `http://127.0.0.1:7545`)
- You'll see **10 accounts** each with 100 ETH — these are your 10 nodes ✅

---

### Step 3 — Compile the Smart Contract

```bash
bash scripts/compile.sh
```

This generates `build/LandRegistry.abi` and `build/LandRegistry.bin`.

---

### Step 4 — Deploy the Contract

```bash
node scripts/deploy.js
```

This deploys the contract to Ganache and saves config to `build/config.json`.

You'll see:
```
✅ Contract deployed at: 0xABC...
💾 Config saved to build/config.json
```

---

### Step 5 — Start the Backend Server

```bash
node scripts/server.js
```

Server starts at: http://localhost:3001

---

### Step 6 — Open the Frontend

Open your browser and go to:
```
http://localhost:3001
```

You'll see the full Land Registry DApp UI!

---

## 🎯 Demo Flow (For Your Assignment)

### Register Land (Tab: Register Land)
1. Go to **Register Land** tab
2. Enter Land ID: `1001`
3. Location: `45 MG Road, Bengaluru`
4. Area: `2400 sq ft`
5. Select Owner: `[1] Landowner 1`
6. Document Hash: `0xabc123def456` (any hash)
7. Click **Register on Blockchain**

### Transfer Ownership (Tab: Transfer)
1. Go to **Transfer** tab
2. Land ID: `1001`
3. From: `[1] Landowner 1`
4. To: `[2] Landowner 2`
5. Click **Transfer Ownership**

### View in Ganache
- Open Ganache → **Transactions** tab
- You'll see the transactions mined as blocks!

### Explore Land (Tab: Explore)
- Search Land ID `1001`
- See full ownership history and all transactions

---

## 📁 Project Structure

```
land-registry/
├── contracts/
│   └── LandRegistry.sol     ← Solidity Smart Contract
├── scripts/
│   ├── compile.sh           ← Compile contract
│   ├── deploy.js            ← Deploy to Ganache
│   └── server.js            ← Express backend API
├── frontend/
│   └── index.html           ← Full UI (Dashboard, Nodes, Register, Transfer, Explore, Blockchain)
├── build/                   ← Generated after compile
│   ├── LandRegistry.abi
│   ├── LandRegistry.bin
│   └── config.json          ← Generated after deploy
├── package.json
└── README.md
```

---

## 🖧 10 Nodes Explained

Ganache provides 10 pre-funded accounts by default:

| Index | Label | Role |
|-------|-------|------|
| 0 | Government Authority | Deploys contract, registers land |
| 1 | Landowner 1 | Can own and transfer land |
| 2 | Landowner 2 | Can own and transfer land |
| 3 | Landowner 3 | Can own and transfer land |
| 4–9 | Node 4–9 | Additional network nodes |

Each account = a node on the Ethereum network ✅

---

## 🔑 Smart Contract Features

- ✅ Register land (authority only)
- ✅ Transfer ownership (current owner only)
- ✅ Get land details
- ✅ Full ownership history
- ✅ Transaction logs
- ✅ Document hash (tamper-proof)
- ✅ Event emission (LandRegistered, LandTransferred)
- ✅ Role-based access control

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/info | Network info, all accounts |
| GET | /api/lands | All registered lands |
| GET | /api/land/:id | Single land details + history |
| POST | /api/register | Register new land |
| POST | /api/transfer | Transfer ownership |
| GET | /api/blocks | Recent blockchain blocks |
=======

