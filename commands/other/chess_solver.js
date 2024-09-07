const { SlashCommandBuilder } = require("discord.js");
const https = require("https");
const fs = require("fs");
const util = require("util");
const path = require("path");
const execAsync = util.promisify(require("child_process").exec);
const client = require("../../index.js");

async function fetchImage(imageAttachment) {
    return new Promise((resolve, reject) => {
        https
            .get(imageAttachment.url, (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error(`Failed to fetch image: ${response.statusMessage}`));
                }

                const data = [];
                response.on("data", (chunk) => data.push(chunk));
                response.on("end", () => resolve(Buffer.concat(data)));
            })
            .on("error", reject);
    });
}

async function executeChessSolver() {
    try {
        const { stdout } = await execAsync("python ./commands/other/chess_solver.py");
        if (!stdout) return [];

        return stdout.trim().split("\r\n");
    } catch (error) {
        console.error("Error executing chess solver:", error);
        return [];
    }
}

async function processImage(imageAttachment) {
    try {
        const image = await fetchImage(imageAttachment);
        const imagePath = path.resolve("./data/image.png");

        fs.writeFileSync(imagePath, image);

        const result = await executeChessSolver();
        return { result, imagePath };
    } catch (error) {
        console.error("Error processing image:", error);
        throw error;
    }
}

async function replyWithBestMoves(interaction, imageAttachment) {
    try {
        const { result, imagePath } = await processImage(imageAttachment);

        if (result.length === 0) {
            return interaction.followUp("No valid chessboard detected.");
        }

        const reply = `Best move for white: **${result[0]}**\nBest move for black: **${result[1]}**`;

        await interaction.followUp({
            content: reply,
            files: [imagePath],
        });
    } catch (error) {
        await interaction.followUp("An error occurred while processing the image.");
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chess_solver")
        .setDescription("Gives the best chess move based on an image using stockfish")
        .addAttachmentOption((option) =>
            option.setName("image").setDescription("Attach a chess board image").setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const imageAttachment = interaction.options.getAttachment("image");
        await replyWithBestMoves(interaction, imageAttachment);
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const imageAttachment = message.attachments.first();
    if (!imageAttachment) return;

    try {
        const { result, imagePath } = await processImage(imageAttachment);

        if (result.length === 0) return;

        const reply = `Best move for white: **${result[0]}**\nBest move for black: **${result[1]}**`;

        await message.reply({
            content: reply,
            files: [imagePath],
        });
    } catch (error) {
        await message.reply("An error occurred while processing the image.");
    }
});
