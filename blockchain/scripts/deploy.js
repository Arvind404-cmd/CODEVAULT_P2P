const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying CodeVault Marketplace...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy Marketplace contract
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();
  
  await marketplace.waitForDeployment();
  const contractAddress = await marketplace.getAddress();
  
  console.log("✅ Marketplace deployed to:", contractAddress);

  // Save deployment info for frontend
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    chainId: hre.network.config.chainId
  };

  // Save to frontend
  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  // Save contract address
  fs.writeFileSync(
    path.join(frontendDir, "contractAddress.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Copy ABI to frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/Marketplace.sol/Marketplace.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(
      path.join(frontendDir, "MarketplaceABI.json"),
      JSON.stringify(artifact.abi, null, 2)
    );
    console.log("📄 ABI copied to frontend");
  }

  console.log("📁 Deployment info saved to frontend/src/contracts/");

  // Add some test files if on local network
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("\n📦 Adding sample files to marketplace...");
    
    const sampleFiles = [
      {
        cid: "QmSampleCID1234567890abcdef",
        title: "React Component Library",
        description: "A collection of 50+ reusable React components with TypeScript support",
        previewImage: "QmPreview1234",
        price: hre.ethers.parseEther("0.01")
      },
      {
        cid: "QmSampleCID2345678901bcdefg",
        title: "Python ML Starter Kit",
        description: "Complete machine learning project template with TensorFlow and PyTorch examples",
        previewImage: "QmPreview2345",
        price: hre.ethers.parseEther("0.02")
      },
      {
        cid: "QmSampleCID3456789012cdefgh",
        title: "Full-Stack Web App Template",
        description: "Node.js + React + MongoDB boilerplate with authentication",
        previewImage: "QmPreview3456",
        price: hre.ethers.parseEther("0.015")
      }
    ];

    for (const file of sampleFiles) {
      await marketplace.uploadFile(
        file.cid,
        file.title,
        file.description,
        file.previewImage,
        file.price
      );
      console.log(`  ✓ Added: ${file.title}`);
    }

    console.log("\n🎉 Deployment complete!");
    console.log(`📊 Total files in marketplace: ${await marketplace.fileCount()}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
