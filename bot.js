require('dotenv').config();
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');
const AWS = require('aws-sdk');

// Initialize the AWS SDK with your credentials directly in the code
AWS.config.update({
  accessKeyId: 'AKIAVRUVVVUMXIC5RVXS',
  secretAccessKey: '0Lyc2ZCoaV882SeraJ+4cgzXi++epH/3HrHBtqIx',
  region: 'eu-north-1'
});

// Initialize the Telegraf bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Handle text messages from users
bot.on("text", async (ctx) => {
  const walletAddress = ctx.message.text.trim();
  console.log("Received message:", walletAddress);
  console.log("Type of walletAddress:", typeof walletAddress);

  // Validate Ethereum wallet address
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    console.log("Invalid wallet address");
    return ctx.reply("Invalid wallet address. Please send a valid Ethereum address.");
  }

  console.log("Valid Ethereum address:", walletAddress);

  // Retrieve private key from AWS Secrets Manager
  console.time("SecretsManager");
  let privateKey;
  try {
    const secretsManager = new AWS.SecretsManager();
    const data = await secretsManager.getSecretValue({ SecretId: 'nftfans-private-key' }).promise();
    const secret = data.SecretString;
    privateKey = JSON.parse(secret).privateKey;  // Assuming the private key is stored as { "privateKey": "your_private_key" }
    console.timeEnd("SecretsManager");
  } catch (error) {
    console.log("Error retrieving private key.");
    return ctx.reply("An error occurred while retrieving the private key. Please try again later.");
  }

  // Initialize Ethereum provider and wallet
  console.log("Initializing Ethereum provider...");
  const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Wallet initialized.");

  // Create contract instance
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contractABI = [
    "function transfer(address to, uint amount) public returns (bool)"
  ];
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  console.log("Contract instance created.");

  try {
    const amount = ethers.parseEther("1.0"); // Amount of NFTFan tokens to send
    console.log("Amount to send:", amount.toString());

    console.log("Sending transaction...");
    const tx = await contract.transfer(walletAddress, amount);
    console.log("Transaction sent. Waiting for confirmation...");

    await tx.wait(); // Wait for the transaction to be mined
    console.log("Transaction confirmed:", tx.hash);

    // Send confirmation to the user
    ctx.reply(`Successfully sent NFTFan tokens to ${walletAddress}! Transaction hash: ${tx.hash}`);
  } catch (error) {
    console.error("Error sending tokens:", error);
    ctx.reply("There was an error processing your transaction. Please try again later.");
  }
});

// Launch the bot with a higher timeout to accommodate slower operations
bot.launch({ handlerTimeout: 120000 })  // Timeout increased to 120 seconds
  .then(() => {
    console.log("Bot is running...");
  })
  .catch((err) => {
    console.error("Error launching the bot:", err);
  });
