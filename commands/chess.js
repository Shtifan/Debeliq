const { SlashCommandBuilder } = require("discord.js");
const client = require("../index.js");
const fetch = require("node-fetch");
const fs = require("fs");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);

async function execute() {
    const { stdout, stderr } = await execAsync("python ./python/chess/main.py");

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

        const image = interaction.options.getAttachment("image");
        const res = await fetch(image.url);
        const buffer = await res.buffer();
        const imagePath = "./python/chess/input.png";

        fs.writeFileSync(imagePath, buffer);

        const result = await execute();

        if (result.length == 0) await interaction.followUp("No valid chessboard detected");
        else {
            let reply = "";
            reply += "Best move for white - " + result[0] + "\n";
            reply += "Best move for black - " + result[1];
            await interaction.followUp({ content: reply, files: [{ attachment: imagePath }] });
        }
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const image = message.attachments.first();
    if (!image) return;

    const res = await fetch(image.url);
    const buffer = await res.buffer();
    const imagePath = "./python/chess/input.png";

    fs.writeFileSync(imagePath, buffer);

    const result = await execute();

    if (result.length == 0) return;

    let reply = "";
    reply += "Best move for white - " + result[0] + "\n";
    reply += "Best move for black - " + result[1];

    await message.reply(reply);
});
