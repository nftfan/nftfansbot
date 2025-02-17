const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');  // Make sure ethers is imported
require('dotenv').config();  // Import environment variables

const bot = new Telegraf(process.env.BOT_TOKEN);

const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);  // Ethereum RPC provider
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);  // Wallet with private key
const nftFanContractAddress = "0x2017Fcaea540d2925430586DC92818035Bfc2F50";  // NFTFan token contract address
const nftFanABI = ["function transfer(address to, uint amount) public"];  // Simple transfer ABI

const nftFanContract = new ethers.Contract(nftFanContractAddress, nftFanABI, wallet);  // Contract instance

// Start command
bot.start((ctx) => {
    ctx.reply("Welcome! Send me your wallet address to receive NFTFan tokens!");
});

// Receive wallet address and process transaction
bot.on('text', async (ctx) => {
    const walletAddress = ctx.message.text;

    // Check if the message looks like a valid Ethereum address
    if (!ethers.utils.isAddress(walletAddress)) {
        ctx.reply("Invalid wallet address. Please send a valid Ethereum address.");
        return;
    }

    // Send tokens
    try {
        console.log(`Received wallet address: ${walletAddress}`);
        const amount = ethers.utils.parseEther("10");  // Adjust token amount as needed

        // Execute the transfer
        const tx = await nftFanContract.transfer(walletAddress, amount);
        console.log("Transaction successful:", tx.hash);
        ctx.reply(`Transaction successful! Tokens sent to ${walletAddress}`);
    } catch (error) {
        console.error("Error sending tokens:", error);
        ctx.reply("There was an error processing your transaction. Please try again later.");
    }
});

// Start bot
bot.launch()
    .then(() => {
        console.log("Bot is running...");
    })
    .catch((err) => {
        console.error("Error launching the bot:", err);
    });
