require("dotenv").config();
const { Telegraf } = require("telegraf");
const { ethers } = require("ethers");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// AWS Secrets Manager configuration with hardcoded credentials (not recommended)
const secretName = "nftfans-private-key"; // Your secret name in AWS Secrets Manager
const region = "eu-north-1"; // AWS region where your secret is stored

const awsCredentials = {
  accessKeyId: "AKIAVRUVVVUMXIC5RVXS",
  secretAccessKey: "0Lyc2ZCoaV882SeraJ+4cgzXi++epH/3HrHBtqIx"
};

const secretsClient = new SecretsManagerClient({ region, credentials: awsCredentials });

// Telegram Bot Token from .env
const BOT_TOKEN = process.env.BOT_TOKEN;

// Function to retrieve the private key from AWS Secrets Manager
async function getPrivateKeyFromSecretsManager() {
  let response;
  try {
    response = await secretsClient.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT",
      })
    );
    const secret = response.SecretString;
    const secretJson = JSON.parse(secret);
    return secretJson.PRIVATE_KEY; // Assuming secret stored as: { "PRIVATE_KEY": "your_private_key_here" }
  } catch (error) {
    console.error("Error retrieving the secret:", error);
    throw error;
  }
}

// Initialize the Telegram bot
const bot = new Telegraf(BOT_TOKEN);

// Start command
bot.start((ctx) => {
  ctx.reply("Welcome! Send me your wallet address to receive NFTFan tokens!");
});

// Listen for text messages (wallet addresses)
bot.on("text", async (ctx) => {
  const walletAddress = ctx.message.text.trim();
  console.log("Received message:", walletAddress);
  console.log("Type of walletAddress:", typeof walletAddress);

  // Use ethers.isAddress (ethers v6) to validate the Ethereum address
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return ctx.reply("Invalid wallet address. Please send a valid Ethereum address.");
  }

  // Retrieve the private key securely from AWS Secrets Manager
  let privateKey;
  try {
    privateKey = await getPrivateKeyFromSecretsManager();
  } catch (error) {
    return ctx.reply("An error occurred while retrieving the private key. Please try again later.");
  }

  // Set up the provider using your Infura RPC URL from .env
  const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

  // Initialize the wallet with the private key
  const wallet = new ethers.Wallet(privateKey, provider);

  // Contract address and ABI (simplified for token transfer)
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contractABI = [
    "function transfer(address to, uint amount) public returns (bool)"
  ];
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  try {
    // Convert token amount using ethers.parseEther (ethers v6)
    const amount = ethers.parseEther("1.0"); // Sending 1 NFTFan token (adjust as needed)
    
    // Execute the transfer transaction
    const tx = await contract.transfer(walletAddress, amount);
    
    // Wait for the transaction to be mined
    await tx.wait();

    // Notify the user
    ctx.reply(`Successfully sent NFTFan tokens to ${walletAddress}! Transaction hash: ${tx.hash}`);
  } catch (error) {
    console.error("Error sending tokens:", error);
    ctx.reply("There was an error processing your transaction. Please try again later.");
  }
});

// Launch the bot
bot.launch().then(() => {
  console.log("Bot is running...");
}).catch((err) => {
  console.error("Error launching the bot:", err);
});
