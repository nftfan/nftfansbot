require('dotenv').config();
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');

// Create a new Telegram bot using the token from the .env file
const bot = new Telegraf(process.env.BOT_TOKEN);

// Connect to Ethereum or Polygon network using the provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Load the wallet using your private key and connect it to the provider
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Set up the NFTFan contract
const contractAddress = process.env.CONTRACT_ADDRESS;
const nftFanABI = [
    "function transfer(address to, uint amount) public returns (bool)",
];
const nftFanContract = new ethers.Contract(contractAddress, nftFanABI, wallet);

// Start command for the bot
bot.start((ctx) => {
    ctx.reply('Welcome! Send me your wallet address to receive NFTFan tokens!');
});

// Command to handle user messages (wallet address)
bot.on('text', async (ctx) => {
    const userWalletAddress = ctx.message.text.trim();

    // Check if the user provided a valid Ethereum address
    if (ethers.utils.isAddress(userWalletAddress)) {
        try {
            // Define the amount of NFTFan tokens to send (5 billion tokens)
            const amount = ethers.utils.parseUnits("5000000000", 18); // 5 billion tokens

            // Send the tokens to the provided address
            const tx = await nftFanContract.transfer(userWalletAddress, amount);
            await tx.wait(); // Wait for the transaction to be mined

            // Notify the user that the transaction was successful
            ctx.reply(`Successfully sent 5 billion NFTFan tokens to ${userWalletAddress}!`);
        } catch (error) {
            // If there's an error (like insufficient funds), notify the user
            ctx.reply('Error sending tokens. Please try again later.');
            console.error(error);
        }
    } else {
        // If the user provided an invalid wallet address
        ctx.reply('Invalid wallet address. Please provide a valid address.');
    }
});

// Launch the bot
bot.launch()
    .then(() => {
        console.log('Bot is running!');
    })
    .catch((err) => {
        console.error('Error launching bot:', err);
    });
