/**
 * deploy.js — Deploys LandRegistry contract to Ganache
 * Run: node scripts/deploy.js
 * Make sure Ganache is running on http://127.0.0.1:7545
 */

const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");

// ─── Load compiled ABI + Bytecode ────────────────────────────────────────────
const abiPath = path.join(__dirname, "../build/LandRegistry.abi");
const binPath = path.join(__dirname, "../build/LandRegistry.bin");

if (!fs.existsSync(abiPath) || !fs.existsSync(binPath)) {
  console.error("❌  Build files not found. Run compile first:\n");
  console.error(
    "   npx solcjs --abi --bin --base-path . contracts/LandRegistry.sol --output-dir build\n"
  );
  process.exit(1);
}

const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
const bytecode = "0x" + fs.readFileSync(binPath, "utf8").trim();

// ─── Connect to Ganache ───────────────────────────────────────────────────────
const GANACHE_URL = process.env.GANACHE_URL || "http://127.0.0.1:7545";
const web3 = new Web3(GANACHE_URL);

async function deploy() {
  try {
    console.log(`\n🔗  Connecting to Ganache at ${GANACHE_URL}...`);
    const accounts = await web3.eth.getAccounts();
    console.log(`✅  Connected! Found ${accounts.length} accounts.\n`);

    console.log("📋  Accounts (nodes) available:");
    accounts.forEach((acc, i) => console.log(`   [${i}] ${acc}`));

    const deployer = accounts[0];
    console.log(`\n🚀  Deploying from authority account: ${deployer}\n`);

    const contract = new web3.eth.Contract(abi);
    const deployed = await contract
      .deploy({ data: bytecode })
      .send({ from: deployer, gas: 3000000 });

    const contractAddress = deployed.options.address;
    console.log(`✅  Contract deployed at: ${contractAddress}\n`);

    // Save contract address and ABI for the server
    const config = {
      contractAddress,
      abi,
      authority: deployer,
      accounts,
      ganacheUrl: GANACHE_URL,
    };

    fs.writeFileSync(
      path.join(__dirname, "../build/config.json"),
      JSON.stringify(config, null, 2)
    );

    console.log("💾  Config saved to build/config.json");
    console.log("\n🎉  Deployment complete! Now run: node scripts/server.js\n");
  } catch (err) {
    console.error("❌  Deployment failed:", err.message);
    process.exit(1);
  }
}

deploy();
