require('dotenv').config();
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize the Secrets Manager client with hardcoded AWS credentials (not recommended for production)
const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION, // e.g., "eu-north-1"
  credentials: {
    accessKeyId: 'AKIAVRUVVVUMXIC5RVXS',
    secretAccessKey: '0Lyc2ZCoaV882SeraJ+4cgzXi++epH/3HrHBtqIx'
  }
});

// Initialize the Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN);

async function getPrivateKeyFromSecretsManager() {
  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.SECRET_NAME // e.g., "nftfans-private-key"
    });
    const data = await secretsClient.send(command);
    let privateKey;
    if (data.SecretString) {
      const parsedSecret = JSON.parse(data.SecretString);
      privateKey = parsedSecret.privateKey; // Ensure your secret is stored as: { "privateKey": "0x..." }
    }
    // Validate the private key format: must be a hex string with 66 characters (if 0x-prefixed) or 64 without.
    if (!privateKey || !ethers.isHexString(privateKey) || (privateKey.length !== 66 && privateKey.length !== 64)) {
      throw new Error('Invalid private key format');
    }
    console.log("Private key fetched successfully.");
    return privateKey;
  } catch (error) {
    console.error("Error retrieving private key or invalid format:", error);
    throw error;
  }
}

bot.on('text', async (ctx) => {
  const walletAddress = ctx.message.text.trim();
  console.log(`Received message: ${walletAddress}`);
  console.log('Type of walletAddress:', typeof walletAddress);

  // Validate Ethereum address using ethers.v6
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    console.log("Invalid wallet address");
    return ctx.reply("Invalid wallet address. Please send a valid Ethereum address.");
  }
  console.log(`Valid Ethereum address: ${walletAddress}`);

  let privateKey;
  try {
    privateKey = await getPrivateKeyFromSecretsManager();
  } catch (error) {
    return ctx.reply("An error occurred while retrieving the private key. Please try again later.");
  }

  console.log("Initializing Ethereum provider...");
  const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`Ethereum wallet address: ${wallet.address}`);

  // Set up the contract instance
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contractABI = [
    "function transfer(address to, uint amount) public returns (bool)"
  ];
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  console.log("Contract instance created.");

  try {
    const amount = ethers.parseEther("1.0"); // Sending 1 NFTFan token (adjust as needed)
    console.log("Amount to send:", amount.toString());
    console.log("Sending transaction...");
    const tx = await contract.transfer(walletAddress, amount);
    console.log("Transaction sent. Waiting for confirmation...");
    await tx.wait();
    console.log("Transaction confirmed:", tx.hash);
    ctx.reply(`Successfully sent NFTFan tokens to ${walletAddress}! Transaction hash: ${tx.hash}`);
  } catch (error) {
    console.error("Error sending tokens:", error);
    ctx.reply("There was an error processing your transaction. Please try again later.");
  }
});

bot.launch({ handlerTimeout: 120000 })
  .then(() => {
    console.log("Bot is up and running!");
  })
  .catch((err) => {
    console.error("Error launching the bot:", err);
  });

