require("dotenv").config();
const { Telegraf } = require("telegraf");
const { ethers } = require("ethers");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// AWS Secrets Manager configuration
const secretName = "nftfans-private-key"; // The name of your secret in AWS Secrets Manager
const region = "eu-north-1"; // AWS region where your secret is stored

// Telegram Bot Token
const BOT_TOKEN = process.env.BOT_TOKEN;

// Initialize AWS Secrets Manager client
const secretsClient = new SecretsManagerClient({ region });

async function getPrivateKeyFromSecretsManager() {
  let response;
  try {
    // Fetch the secret from Secrets Manager
    response = await secretsClient.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT",
      })
    );
    
    const secret = response.SecretString;
    const secretJson = JSON.parse(secret);
    return secretJson.PRIVATE_KEY; // Assuming the secret is stored as { "PRIVATE_KEY": "your_private_key_here" }
    
  } catch (error) {
    console.error("Error retrieving the secret:", error);
    throw error;
  }
}

// Initialize the bot
const bot = new Telegraf(BOT_TOKEN);

// Start command
bot.start((ctx) => {
  ctx.reply("Welcome! Send me your wallet address to receive NFTFan tokens!");
});

// Receive wallet address from user
bot.on("text", async (ctx) => {
  const walletAddress = ctx.message.text.trim();
  
  // Validate the wallet address
  if (!ethers.utils.isAddress(walletAddress)) {
    return ctx.reply("Invalid wallet address. Please send a valid address.");
  }
  
  // Retrieve the private key securely from AWS Secrets Manager
  let privateKey;
  try {
    privateKey = await getPrivateKeyFromSecretsManager();
  } catch (error) {
    return ctx.reply("An error occurred while retrieving the private key. Please try again later.");
  }

  // Set up the provider (using Infura for Polygon mainnet)
  const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

  // Initialize the wallet with the private key
  const wallet = new ethers.Wallet(privateKey, provider);

  // Contract address and ABI (simplified)
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contractABI = [
    "function transfer(address to, uint amount) public returns (bool)",
  ];
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  try {
    // Send NFTFan tokens (amount can be adjusted)
    const amount = ethers.utils.parseEther("1.0"); // 1 NFTFan token
    const tx = await contract.transfer(walletAddress, amount);
    
    // Wait for the transaction to be mined
    await tx.wait();

    // Notify the user about the transaction
    ctx.reply(`Successfully sent NFTFan tokens to ${walletAddress}! Transaction hash: ${tx.hash}`);
  } catch (error) {
    console.error("Error sending tokens:", error);
    ctx.reply("There was an error processing your transaction. Please try again later.");
  }
});

// Start the bot
bot.launch().then(() => {
  console.log("Bot is running...");
});
