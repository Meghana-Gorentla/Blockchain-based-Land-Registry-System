#!/bin/bash
# compile.sh — Compiles the Solidity smart contract
# Run: bash scripts/compile.sh

echo ""
echo "🔨 Compiling LandRegistry.sol..."
mkdir -p build

npx solcjs \
  --abi \
  --bin \
  --base-path . \
  contracts/LandRegistry.sol \
  --output-dir build

# Rename output files to clean names
for f in build/*LandRegistry*; do
  if [[ "$f" == *".abi" ]]; then
    cp "$f" build/LandRegistry.abi
  fi
  if [[ "$f" == *".bin" ]]; then
    cp "$f" build/LandRegistry.bin
  fi
done

echo "✅ Compilation done!"
echo "   ABI  → build/LandRegistry.abi"
echo "   BIN  → build/LandRegistry.bin"
echo ""
echo "Next: node scripts/deploy.js"
