/**
 * server.js — REST API backend for Land Registry DApp
 * Run: node scripts/server.js
 */

const express = require("express");
const cors = require("cors");
const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// ─── Load config ─────────────────────────────────────────────────────────────
const configPath = path.join(__dirname, "../build/config.json");
if (!fs.existsSync(configPath)) {
  console.error("❌  build/config.json not found. Run deploy.js first.");
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath));
const { contractAddress, abi, authority, accounts, ganacheUrl } = config;

const web3 = new Web3(ganacheUrl);
const contract = new web3.eth.Contract(abi, contractAddress);

// ─── Helper ───────────────────────────────────────────────────────────────────
function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "N/A";
}

function getAccountLabel(index) {
  if (index === 0) return "Government Authority";
  return `Landowner ${index}`;
}

function getAccountRole(index) {
  return index === 0 ? "AUTHORITY" : "OWNER";
}

// ─── Reference Data (Pre-populated Land Properties) ─────────────────────────
const LANDS_REFERENCE = {
  1001: { location: "45 MG Road, Bengaluru", area: "2400 sq ft" },
  1002: { location: "123 Brigade Road, Bengaluru", area: "1500 sq ft" },
  1003: { location: "Lavelle Road, Delhi", area: "3500 sq ft" },
  1004: { location: "MG Road, Mumbai", area: "1800 sq ft" },
  1005: { location: "Marine Drive, Mumbai", area: "4000 sq ft" },
  1006: { location: "Richmond Road, Bangalore", area: "2200 sq ft" },
  1007: { location: "Bandra, Mumbai", area: "3000 sq ft" },
  1008: { location: "Koramangala, Bangalore", area: "1600 sq ft" },
  1009: { location: "Jubilee Hills, Hyderabad", area: "2800 sq ft" },
  1010: { location: "Indiranagar, Bangalore", area: "2100 sq ft" },
  1011: { location: "Viharamahadevi Park, Colombo", area: "3200 sq ft" },
  1012: { location: "Purl Road, Puri", area: "2900 sq ft" },
  1013: { location: "Mount Road, Chennai", area: "2600 sq ft" },
  1014: { location: "Connaught Place, New Delhi", area: "3800 sq ft" },
  1015: { location: "Park Street, Kolkata", area: "2400 sq ft" },
  1016: { location: "Linking Road, Bandra", area: "3100 sq ft" },
  1017: { location: "Sarjapur Road, Bangalore", area: "2750 sq ft" },
  1018: { location: "Whitefield, Bangalore", area: "3400 sq ft" },
  1019: { location: "Noida City Centre, Delhi NCR", area: "2200 sq ft" },
  1020: { location: "Sector 9, Chandigarh", area: "2850 sq ft" },
};

// ─── Email & PIN Credentials ──────────────────────────────────────────────
const ACCOUNT_CREDENTIALS = {
  "authority@landregistry.gov": { accountIndex: 0, pin: "0000" },
  "owner1@email.com": { accountIndex: 1, pin: "1111" },
  "owner2@email.com": { accountIndex: 2, pin: "2222" },
  "owner3@email.com": { accountIndex: 3, pin: "3333" },
  "owner4@email.com": { accountIndex: 4, pin: "4444" },
  "owner5@email.com": { accountIndex: 5, pin: "5555" },
  "owner6@email.com": { accountIndex: 6, pin: "6666" },
  "owner7@email.com": { accountIndex: 7, pin: "7777" },
  "owner8@email.com": { accountIndex: 8, pin: "8888" },
  "owner9@email.com": { accountIndex: 9, pin: "9999" },
  "owner10@email.com": { accountIndex: 10, pin: "1010" },
  "owner11@email.com": { accountIndex: 11, pin: "1111" },
  "owner12@email.com": { accountIndex: 12, pin: "1212" },
  "owner13@email.com": { accountIndex: 13, pin: "1313" },
  "owner14@email.com": { accountIndex: 14, pin: "1414" },
  "owner15@email.com": { accountIndex: 15, pin: "1515" },
  "owner16@email.com": { accountIndex: 16, pin: "1616" },
  "owner17@email.com": { accountIndex: 17, pin: "1717" },
  "owner18@email.com": { accountIndex: 18, pin: "1818" },
  "owner19@email.com": { accountIndex: 19, pin: "1919" },
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/login — authenticate with email + PIN
app.post("/api/login", async (req, res) => {
  const { email, pin } = req.body;
  
  if (!email || !ACCOUNT_CREDENTIALS[email]) {
    return res.status(401).json({ error: "Invalid email" });
  }
  
  const creds = ACCOUNT_CREDENTIALS[email];
  if (pin !== creds.pin) {
    return res.status(401).json({ error: "Invalid PIN" });
  }
  
  try {
    const accountIndex = creds.accountIndex;
    const address = accounts[accountIndex];
    const balance = await web3.eth.getBalance(address);
    const label = getAccountLabel(accountIndex);
    const role = getAccountRole(accountIndex);
    const isAuthority = accountIndex === 0;

    res.json({
      success: true,
      accountIndex,
      address,
      email,
      label,
      role,
      isAuthority,
      balance: parseFloat(web3.utils.fromWei(balance, "ether")).toFixed(4),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/lands-reference — get pre-populated land reference data
app.get("/api/lands-reference", (req, res) => {
  res.json(LANDS_REFERENCE);
});

// GET /api/info — network info, all accounts/nodes
app.get("/api/info", async (req, res) => {
  try {
    const blockNumber = await web3.eth.getBlockNumber();
    const balances = await Promise.all(
      accounts.map(async (acc, i) => {
        const bal = await web3.eth.getBalance(acc);
        return {
          index: i,
          address: acc,
          shortAddress: shortAddr(acc),
          balance: parseFloat(web3.utils.fromWei(bal, "ether")).toFixed(4),
          isAuthority: acc.toLowerCase() === authority.toLowerCase(),
          label: getAccountLabel(i),
        };
      })
    );
    res.json({
      contractAddress,
      authority,
      blockNumber: blockNumber.toString(),
      totalAccounts: accounts.length,
      accounts: balances,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/register — register a new land parcel (Government Authority only)
app.post("/api/register", async (req, res) => {
  const { landId, location, area, ownerIndex, documentHash, userAccountIndex } = req.body;
  
  // Authorization: Only Government Authority (account 0) can register
  if (userAccountIndex !== 0) {
    return res.status(403).json({ error: "❌ Only Government Authority can register lands" });
  }
  
  if (
    landId == null ||
    !location ||
    !area ||
    ownerIndex == null ||
    !documentHash
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const ownerAddress = accounts[ownerIndex];
    const tx = await contract.methods
      .registerLand(
        parseInt(landId),
        location,
        area,
        ownerAddress,
        documentHash
      )
      .send({ from: authority, gas: 500000 });

    res.json({
      success: true,
      txHash: tx.transactionHash,
      blockNumber: tx.blockNumber.toString(),
      landId,
      owner: ownerAddress,
      message: `✅ Land ${landId} registered and mined in Block #${tx.blockNumber}`,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/transfer — transfer land ownership (only current owner can transfer)
app.post("/api/transfer", async (req, res) => {
  const { landId, fromIndex, toIndex, userAccountIndex } = req.body;
  if (landId == null || fromIndex == null || toIndex == null || userAccountIndex == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  try {
    // Get current land owner
    const landData = await contract.methods.getLand(parseInt(landId)).call();
    const currentOwnerAddress = landData[3]; // currentOwner from struct
    const fromAddress = accounts[fromIndex];
    
    // Authorization: Only current owner or authority can transfer
    if (userAccountIndex !== fromIndex && userAccountIndex !== 0) {
      return res.status(403).json({ error: "❌ Only the current owner can transfer this land" });
    }
    
    if (fromAddress.toLowerCase() !== currentOwnerAddress.toLowerCase()) {
      return res.status(403).json({ error: "❌ Address mismatch: You are not the current owner" });
    }
    
    const toAddress = accounts[toIndex];
    const tx = await contract.methods
      .transferLand(parseInt(landId), toAddress)
      .send({ from: fromAddress, gas: 300000 });

    res.json({
      success: true,
      txHash: tx.transactionHash,
      blockNumber: tx.blockNumber.toString(),
      landId,
      from: fromAddress,
      to: toAddress,
      message: `✅ Land ${landId} transferred and mined in Block #${tx.blockNumber}`,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /api/land/:id — get land details
app.get("/api/land/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await contract.methods.getLand(id).call();
    const history = await contract.methods.getOwnershipHistory(id).call();
    const txData = await contract.methods.getLandTransactions(id).call();

    const transactions = txData.froms.map((from, i) => ({
      from,
      to: txData.tos[i],
      timestamp: new Date(parseInt(txData.timestamps[i]) * 1000).toLocaleString(),
      type: txData.txTypes[i],
    }));

    res.json({
      landId: result[0].toString(),
      location: result[1],
      area: result[2],
      currentOwner: result[3],
      documentHash: result[4],
      registeredAt: new Date(parseInt(result[5]) * 1000).toLocaleString(),
      ownershipHistory: history,
      transactions,
    });
  } catch (e) {
    res.status(404).json({ error: "Land not found or not registered" });
  }
});

// GET /api/lands — list all registered lands
app.get("/api/lands", async (req, res) => {
  try {
    const ids = await contract.methods.getAllLandIds().call();
    const lands = await Promise.all(
      ids.map(async (id) => {
        const r = await contract.methods.getLand(parseInt(id)).call();
        return {
          landId: r[0].toString(),
          location: r[1],
          area: r[2],
          currentOwner: shortAddr(r[3]),
          fullOwner: r[3],
          documentHash: r[4],
        };
      })
    );
    res.json({ lands });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/blocks — all blocks
app.get("/api/blocks", async (req, res) => {
  try {
    const latest = await web3.eth.getBlockNumber();
    const blocks = [];
    // Fetch all blocks from latest down to genesis (block 0)
    for (let i = parseInt(latest.toString()); i >= 0; i--) {
      const block = await web3.eth.getBlock(i);
      blocks.push({
        number: block.number.toString(),
        hash: block.hash,
        txCount: block.transactions.length,
        timestamp: new Date(parseInt(block.timestamp) * 1000).toLocaleString(),
      });
    }
    res.json({ latestBlock: latest.toString(), blocks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🚀  Land Registry server running at http://localhost:${PORT}`);
  console.log(`📄  Contract: ${contractAddress}`);
  console.log(`🏛️   Authority: ${shortAddr(authority)}`);
  console.log(`🌐  Nodes: ${accounts.length} accounts on Ganache\n`);
});
