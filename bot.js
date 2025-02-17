const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const nftFanContractAddress = "0x2017Fcaea540d2925430586DC92818035Bfc2F50";
const nftFanABI = ["function transfer(address to, uint amount) public"];

const nftFanContract = new ethers.Contract(nftFanContractAddress, nftFanABI, wallet);

// Start command
bot.start((ctx) => {
    ctx.reply("Welcome! Send me your wallet address to receive NFTFan tokens!");
});

// Receive wallet address and process transaction
bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;

    // Ensure the message is defined and not empty
    if (!messageText) {
        ctx.reply("Sorry, I didn't understand that. Please send a valid Ethereum wallet address.");
        return;
    }

    // Check if the message is a valid Ethereum address
    if (!ethers.utils.isAddress(messageText)) {
        // If the message is not an address, inform the user
        ctx.reply("Invalid wallet address. Please send a valid Ethereum address.");
        return;
    }

    const walletAddress = messageText;

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
