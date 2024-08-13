const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const fetch = require("node-fetch");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const client = require("../../index.js");

async function fetchImage(imageAttachment) {
    const response = await fetch(imageAttachment.url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const buffer = await response.buffer();
    return buffer;
}

async function execute() {
    const { stdout, stderr } = await execAsync("python ./commands/other/chess.py");

    if (!stdout) return [];

    const moves = stdout.trim().split("\r\n");
    return moves;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chess")
        .setDescription("Gives the best chess move based on an image")
        .addAttachmentOption((option) =>
            option.setName("image").setDescription("Attach a chess board image").setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const imageAttachment = interaction.options.getAttachment("image");

        const image = await fetchImage(imageAttachment);
        const inputPath = "./data/image.png";

        fs.writeFileSync(inputPath, image);

        const result = await execute();

        if (result.length == 0) await interaction.followUp("No valid chessboard detected.");
        else {
            let reply = "";
            reply += "Best move for white - " + result[0] + "\n";
            reply += "Best move for black - " + result[1];
            await interaction.followUp({ content: reply, files: [{ attachment: inputPath }] });
        }
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const imageAttachment = message.attachments.first();
    if (!imageAttachment) return;

    const image = await fetchImage(imageAttachment);
    const inputPath = "./data/image.png";

    fs.writeFileSync(inputPath, image);

    const result = await execute();
    if (result.length == 0) return;

    let reply = "";
    reply += "Best move for white - " + result[0] + "\n";
    reply += "Best move for black - " + result[1];

    await message.reply(reply);
});
