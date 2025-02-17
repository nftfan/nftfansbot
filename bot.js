const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');
require('dotenv').config();

// Initialize Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Set up the provider using your RPC URL from the .env file
const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

// Initialize your wallet using the private key from the .env file
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// NFTFan token contract details
const nftFanContractAddress = "0x2017Fcaea540d2925430586DC92818035Bfc2F50";
const nftFanABI = [
  "function transfer(address to, uint amount) public"
];

// Create the contract instance connected with your wallet
const nftFanContract = new ethers.Contract(nftFanContractAddress, nftFanABI, wallet);

// Start command: instructs the user what to do
bot.start((ctx) => {
  ctx.reply("Welcome! Send me your wallet address to receive NFTFan tokens!");
});

// Listen for text messages
bot.on('text', async (ctx) => {
  // Ensure we have a message
  const messageText = ctx.message?.text;
  if (!messageText) {
    ctx.reply("Sorry, I didn't understand that. Please send a valid Ethereum wallet address.");
    return;
  }

  // Use ethers.v6 method to check if the provided text is a valid address
  if (!ethers.isAddress(messageText)) {
    ctx.reply("Invalid wallet address. Please send a valid Ethereum address.");
    return;
  }

  const walletAddress = messageText;
  
  try {
    console.log(`Received wallet address: ${walletAddress}`);
    // Convert the token amount using ethers.parseEther (v6 syntax)
    const amount = ethers.parseEther("10");  // Sending 10 tokens (adjust as needed)
    
    // Execute the token transfer
    const tx = await nftFanContract.transfer(walletAddress, amount);
    console.log("Transaction successful:", tx.hash);
    ctx.reply(`Transaction successful! Tokens sent to ${walletAddress}`);
  } catch (error) {
    console.error("Error sending tokens:", error);
    ctx.reply("There was an error processing your transaction. Please try again later.");
  }
});

// Launch the bot
bot.launch()
  .then(() => {
    console.log("Bot is running...");
  })
  .catch((err) => {
    console.error("Error launching the bot:", err);
  });
