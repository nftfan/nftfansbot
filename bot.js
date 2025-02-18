require('dotenv').config();
const { Telegraf } = require('telegraf');
const AWS = require('aws-sdk');
const { ethers } = require('ethers');

// Initialize AWS SDK for Secrets Manager
const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION
});

// Retrieve the private key from Secrets Manager
async function getPrivateKeyFromSecretsManager() {
  try {
    const secretValue = await secretsManager.getSecretValue({ SecretId: process.env.SECRET_NAME }).promise();
    
    if (secretValue.SecretString) {
      const secret = JSON.parse(secretValue.SecretString);
      const privateKey = secret.privateKey;  // Assuming the private key is stored under the key "privateKey"
      
      if (privateKey && privateKey.startsWith('0x')) {
        return privateKey;
      } else {
        throw new Error('Invalid private key format');
      }
    } else {
      throw new Error('Secret value not found or in binary format');
    }
  } catch (error) {
    console.error('Error retrieving private key from Secrets Manager:', error);
    throw error;
  }
}

// Initialize Telegram bot with your token
const bot = new Telegraf(process.env.BOT_TOKEN);

// Handle received messages
bot.on('text', async (ctx) => {
  const walletAddress = ctx.message.text.trim();
  console.log('Received message:', walletAddress);
  
  // Check if the wallet address is valid
  if (ethers.utils.isAddress(walletAddress)) {
    console.log('Valid Ethereum address:', walletAddress);
    
    try {
      const privateKey = await getPrivateKeyFromSecretsManager();
      console.log('Private Key Retrieved:', privateKey);

      // Initialize Ethereum provider and wallet
      const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Check wallet balance
      const balance = await wallet.getBalance();
      console.log(`Wallet balance for ${walletAddress}:`, ethers.utils.formatEther(balance));

      ctx.reply(`Wallet balance: ${ethers.utils.formatEther(balance)} ETH`);

    } catch (error) {
      ctx.reply('Error retrieving private key or invalid format.');
      console.error('Error:', error);
    }
  } else {
    console.log('Invalid wallet address');
    ctx.reply('Invalid Ethereum address. Please provide a valid address.');
  }
});

// Start the bot
bot.launch().then(() => {
  console.log('Bot started...');
});


