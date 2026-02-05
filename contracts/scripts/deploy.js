const hre = require("hardhat");

async function main() {
  console.log("Deploying Blue Whale Rescue Fund contracts...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // 1. Deploy CharityToken
  console.log("1. Deploying CharityToken (CTK)...");
  const CharityToken = await hre.ethers.getContractFactory("CharityToken");
  const charityToken = await CharityToken.deploy();
  await charityToken.waitForDeployment();
  const tokenAddress = await charityToken.getAddress();
  console.log("   CharityToken deployed to:", tokenAddress);

  // 2. Deploy CharityCrowdfunding
  console.log("\n2. Deploying CharityCrowdfunding...");
  const CharityCrowdfunding = await hre.ethers.getContractFactory("CharityCrowdfunding");
  const crowdfunding = await CharityCrowdfunding.deploy(tokenAddress);
  await crowdfunding.waitForDeployment();
  const crowdfundingAddress = await crowdfunding.getAddress();
  console.log("   CharityCrowdfunding deployed to:", crowdfundingAddress);

  // 3. Set crowdfunding contract in token (to allow minting)
  console.log("\n3. Setting crowdfunding contract in token...");
  const tx = await charityToken.setCrowdfundingContract(crowdfundingAddress);
  await tx.wait();
  console.log("   Crowdfunding contract set successfully!");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log("\nContract Addresses:");
  console.log("  CharityToken (CTK):", tokenAddress);
  console.log("  CharityCrowdfunding:", crowdfundingAddress);
  console.log("\nNetwork:", hre.network.name);
  console.log("\n" + "=".repeat(50));
  console.log("\nNext steps:");
  console.log("1. Copy these addresses to your frontend (DAppPage.jsx)");
  console.log("2. Copy the ABI files from artifacts/contracts/");
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
