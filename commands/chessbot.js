const { SlashCommandBuilder } = require("discord.js");
const client = require("../index.js");
const fetch = require("node-fetch");
const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

async function execute() {
    const { stdout, stderr } = await exec("python ./python/chessbot.py");

    if (!stdout) return [];

    const moves = stdout.trim().split("\r\n");
    return moves;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chessbot")
        .setDescription("Gives the best chess move based on an image")
        .addAttachmentOption((option) =>
            option.setName("image").setDescription("Attach a chess board image").setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("turn")
                .setDescription("Who's turn is it?")
                .addChoices({ name: "White", value: "w" }, { name: "Black", value: "b" })
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const image = interaction.options.getAttachment("image");
        const res = await fetch(image.url);
        const buffer = await res.buffer();
        const imagePath = `./python/image.png`;

        fs.writeFileSync(imagePath, buffer);

        const result = await execute();

        if (result.length == 0) return interaction.followUp("No valid chessboard detected");

        let turn = interaction.options.getString("turn");

        let move = "";
        if (turn == "w") move = result[0];
        if (turn == "b") move = result[3];

        return interaction.followUp({ content: "Best move - " + move, files: [{ attachment: imagePath }] });
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const image = message.attachments.first();
    if (!image) return;

    const res = await fetch(image.url);
    const buffer = await res.buffer();
    const imagePath = `./python/image.png`;

    fs.writeFileSync(imagePath, buffer);

    const result = await execute();

    if (result.length == 0) return;

    let reply = "";
    reply += "If white is on bottom:\n";
    reply += "Best move for white - " + result[0] + "\n";
    reply += "Best move for black - " + result[1] + "\n\n";
    reply += "If black is on bottom:\n";
    reply += "Best move for white - " + result[2] + "\n";
    reply += "Best move for black - " + result[3] + "\n";

    return message.reply(reply);
});
