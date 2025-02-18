const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const bot = new Telegraf(process.env.BOT_TOKEN);
const client = new SecretsManagerClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: 'AKIAVRUVVVUMXIC5RVXS', // Your AWS Access Key ID
    secretAccessKey: '0Lyc2ZCoaV882SeraJ+4cgzXi++epH/3HrHBtqIx', // Your AWS Secret Access Key
  }
});

async function getPrivateKeyFromSecretsManager() {
  try {
    // Fetch secret using AWS SDK v3
    const command = new GetSecretValueCommand({ SecretId: process.env.SECRET_NAME });
    const data = await client.send(command);

    let privateKey;
    if (data.SecretString) {
      const parsedSecret = JSON.parse(data.SecretString);
      privateKey = parsedSecret.privateKey;
    }

    if (!privateKey || !ethers.utils.isHexString(privateKey) || (privateKey.length !== 66 && privateKey.length !== 64)) {
      throw new Error('Invalid private key format');
    }

    console.log("Private key fetched successfully.");
    return privateKey;
  } catch (error) {
    console.log("Error retrieving private key or invalid format:", error);
    throw error; // Handle or log this error appropriately
  }
}

bot.on('text', async (ctx) => {
  const walletAddress = ctx.message.text.trim();

  console.log(`Received message: ${walletAddress}`);
  console.log('Type of walletAddress:', typeof walletAddress);

  // Check if the wallet address is valid
  if (ethers.utils.isAddress(walletAddress)) {
    console.log(`Valid Ethereum address: ${walletAddress}`);
    
    try {
      // Get private key from Secrets Manager
      const privateKey = await getPrivateKeyFromSecretsManager();
      
      // Initialize Ethereum provider and wallet
      const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      const wallet = new ethers.Wallet(privateKey, provider);
      console.log(`Ethereum wallet address: ${wallet.address}`);

      // Proceed with further operations, such as interacting with the contract or sending tokens
      // Example: sending transaction or interacting with your smart contract

    } catch (error) {
      console.log('Error:', error.message);
      ctx.reply('Error occurred while processing your request.');
    }

  } else {
    console.log('Invalid wallet address');
    ctx.reply('Invalid Ethereum wallet address. Please try again with a valid address.');
  }
});

bot.launch().then(() => {
  console.log('Bot is up and running!');
});
