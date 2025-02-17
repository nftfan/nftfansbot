require('dotenv').config();
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Ethereum provider (use a suitable provider for your network like Polygon or Ethereum)
const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

// The contract address and ABI (replace with your actual contract address and ABI)
const contractAddress = '0x2017Fcaea540d2925430586DC92818035Bfc2F50'; // Example address
const contractABI = [
  // ABI details (simplified)
  "function transfer(address recipient, uint256 amount) public returns (bool)"
];

const nftFanContract = new ethers.Contract(contractAddress, contractABI, provider);

// Bot start command
bot.start((ctx) => {
  ctx.reply('Welcome! Send me your wallet address to receive NFTFan tokens!');
});

// Handle text messages (user's wallet address)
bot.on('text', async (ctx) => {
  const walletAddress = ctx.message.text;

  // Log the wallet address for debugging
  console.log(`Received wallet address: ${walletAddress}`);

  // Validate the wallet address (Ethereum address validation)
  if (isValidWalletAddress(walletAddress)) {
    ctx.reply(`You provided the wallet address: ${walletAddress}. Processing your request...`);

    try {
      // Send NFTFan tokens to the user (replace with actual sending logic)
      await sendNFTFanTokens(walletAddress);
      ctx.reply(`NFTFan tokens sent to ${walletAddress}`);
    } catch (error) {
      console.error('Error sending tokens:', error);
      ctx.reply('There was an error processing your transaction. Please try again later.');
    }
  } else {
    ctx.reply('Please send a valid wallet address. Example: 0x1234567890abcdef1234567890abcdef12345678');
  }
});

// Validate Ethereum wallet address format
function isValidWalletAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);  // Basic Ethereum address validation
}

// Function to send NFTFan tokens (make sure to use your wallet's private key)
async function sendNFTFanTokens(address) {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Ensure the wallet has enough balance
  const balance = await provider.getBalance(wallet.address);
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    throw new Error('Insufficient balance to send tokens.');
  }

  const contractWithSigner = nftFanContract.connect(wallet);

  // Amount of tokens to send (adjust according to your token's decimals)
  const amount = ethers.utils.parseUnits('5000000000', 18);  // Example: 5 billion tokens with 18 decimals

  // Send tokens
  const tx = await contractWithSigner.transfer(address, amount);
  await tx.wait(); // Wait for the transaction to be mined
}

// Start the bot
bot.launch().then(() => {
  console.log('Bot is running...');
}).catch((error) => {
  console.error('Error starting the bot:', error);
});
