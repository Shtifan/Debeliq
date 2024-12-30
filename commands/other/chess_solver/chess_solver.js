const { SlashCommandBuilder } = require("discord.js");
const https = require("https");
const fs = require("fs");
const path = require("path");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const client = require("../../../index.js");

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
        const { stdout } = await execAsync("python ./commands/other/chess_solver/chess_solver.py");
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

async function message_reply(imageAttachment) {
    try {
        const { result, imagePath } = await processImage(imageAttachment);

        if (result.length === 0) {
            return 0;
        }

        const reply = `Best move for white: **${result[0]}**\nBest move for black: **${result[1]}**`;

        return {
            content: reply,
            files: [imagePath],
        };
    } catch (error) {
        return 0;
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
        await interaction.reply("This command is currently disabled.");
        /*
        await interaction.deferReply();

        const imageAttachment = interaction.options.getAttachment("image");

        let reply = await message_reply(imageAttachment);
        if (reply == 0) reply = "No valid chessboard detected.";

        await interaction.followUp(reply);
        */
    },
};

client.on("messageCreate", async (message) => {
    /*
    if (message.author.bot) return;

    const imageAttachment = message.attachments.first();
    if (!imageAttachment) return;

    let reply = await message_reply(imageAttachment);
    if (reply == 0) return;

    await message.reply(reply);
    */
});
