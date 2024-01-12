const { SlashCommandBuilder } = require("discord.js");
const client = require("../index.js");
const fetch = require("node-fetch");
const fs = require("fs");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);

async function execute() {
    const stdout = await execAsync("python ./chessbot/main.py");

    const moves = stdout
        .trim()
        .split("\n")
        .map((move) => move.replace("\r", ""));
    return moves;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chessbot")
        .setDescription("Gives the best chess move based on an image")
        .addAttachmentOption((option) =>
            option.setName("image").setDescription("Attach a chess board image").setRequired(true)
        ),

    async execute(interaction) {
        const image = interaction.options.getAttachment("image");
        const res = await fetch(image.url);
        const buffer = await res.buffer();
        const imagePath = `./chessbot/image.png`;

        fs.writeFileSync(imagePath, buffer);

        const result = await execute();

        if (result.length == 0) return interaction.reply("No valid chessboard detected");

        let reply = "";
        reply += "Best move for white - " + result[0] + "\n";
        reply += "Best move for black - " + result[1];

        await interaction.reply(reply);
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const image = message.attachments.first();
    if (!image) return;

    const res = await fetch(image.url);
    const buffer = await res.buffer();
    const imagePath = `./chessbot/image.png`;

    fs.writeFileSync(imagePath, buffer);

    const result = await execute();

    if (result.length == 0) return;

    let reply = "";
    reply += "Best move for white - " + result[0] + "\n";
    reply += "Best move for black - " + result[1];

    await message.reply(reply);
});
