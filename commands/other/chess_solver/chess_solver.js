const { SlashCommandBuilder } = require("discord.js");
const https = require("https");
const fs = require("fs").promises;
const path = require("path");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const client = require("../../../index.js");

const dataDir = "./data";
const imagePath = path.join(dataDir, "image.png");

async function ensureDataDir() {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function fetchImage(imageAttachment) {
    return new Promise((resolve, reject) => {
        if (!imageAttachment || !imageAttachment.url) {
            reject(new Error("Invalid image attachment"));
            return;
        }

        https
            .get(imageAttachment.url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to fetch image: ${response.statusMessage}`));
                    return;
                }

                const data = [];
                response.on("data", (chunk) => data.push(chunk));
                response.on("end", () => resolve(Buffer.concat(data)));
            })
            .on("error", (error) => reject(new Error(`Failed to fetch image: ${error.message}`)));
    });
}

async function executeChessSolver() {
    try {
        const { stdout, stderr } = await execAsync("python chess_solver.py");
        if (stderr) {
            throw new Error(`Chess solver error: ${stderr}`);
        }
        return stdout;
    } catch (error) {
        throw new Error(`Failed to execute chess solver: ${error.message}`);
    }
}

async function processImage(imageAttachment) {
    try {
        const image = await fetchImage(imageAttachment);
        await ensureDataDir();
        await fs.writeFile(imagePath, image);
        const result = await executeChessSolver();
        return { result, imagePath };
    } catch (error) {
        console.error("Error processing image:", error);
        throw error;
    } finally {
        try {
            await fs.unlink(imagePath);
        } catch (error) {
            console.error("Error cleaning up image file:", error);
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chess_solver")
        .setDescription("Solve a chess position from an image")
        .addAttachmentOption((option) =>
            option.setName("image").setDescription("The image containing the chess position").setRequired(true)
        ),

    async execute(interaction) {
        try {
            const imageAttachment = interaction.options.getAttachment("image");

            if (!imageAttachment.contentType.startsWith("image/")) {
                await interaction.reply({
                    content: "Please provide a valid image file.",
                    ephemeral: true,
                });
                return;
            }

            await interaction.deferReply();

            const { result } = await processImage(imageAttachment);

            if (!result || result.trim() === "") {
                await interaction.editReply({
                    content: "No solution found for this position.",
                    ephemeral: true,
                });
                return;
            }

            await interaction.editReply({
                content: `Solution:\n\`\`\`\n${result}\n\`\`\``,
            });
        } catch (error) {
            console.error("Error in chess_solver command:", error);
            const errorMessage = interaction.deferred ? interaction.editReply : interaction.reply;
            await errorMessage({
                content: `An error occurred while processing your request: ${error.message}`,
                ephemeral: true,
            });
        }
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
