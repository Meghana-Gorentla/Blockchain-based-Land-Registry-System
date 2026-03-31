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

// ─── Routes ───────────────────────────────────────────────────────────────────

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
          label:
            i === 0
              ? "Government Authority"
              : i <= 3
              ? `Landowner ${i}`
              : `Node ${i}`,
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

// POST /api/register — register a new land parcel
app.post("/api/register", async (req, res) => {
  const { landId, location, area, ownerIndex, documentHash } = req.body;
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
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/transfer — transfer land ownership
app.post("/api/transfer", async (req, res) => {
  const { landId, fromIndex, toIndex } = req.body;
  if (landId == null || fromIndex == null || toIndex == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const fromAddress = accounts[fromIndex];
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

// GET /api/blocks — recent blocks
app.get("/api/blocks", async (req, res) => {
  try {
    const latest = await web3.eth.getBlockNumber();
    const blocks = [];
    const count = Math.min(5, parseInt(latest.toString()));
    for (let i = parseInt(latest.toString()); i > parseInt(latest.toString()) - count; i--) {
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
