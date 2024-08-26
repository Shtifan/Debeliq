const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const axios = require("axios");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);

async function fetchImage(imageAttachment) {
    const response = await axios.get(imageAttachment.url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
}

async function execute() {
    const { stdout, stderr } = await execAsync("python ./commands/other/chess.py");

    if (!stdout) return;

    const move = stdout.trim();
    return move;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chess")
        .setDescription("Gives the best chess move based on an image")
        .addAttachmentOption((option) =>
            option.setName("image").setDescription("Attach a chess board image").setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("move")
                .setDescription("Who is about to move?")
                .setRequired(true)
                .addChoices({ name: "White to play", value: "w" }, { name: "Black to play", value: "b" })
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const imageAttachment = interaction.options.getAttachment("image");
        const move = interaction.options.getString("move");

        const image = await fetchImage(imageAttachment);
        const inputPath = "./data/image.png";
        fs.writeFileSync(inputPath, image);

        const movePath = "./data/move.txt";
        fs.writeFileSync(movePath, move);

        const result = await execute();

        if (!result) await interaction.followUp("No valid chessboard detected.");
        else {
            await interaction.followUp({ content: `Best move: ${result}`, files: [{ attachment: inputPath }] });
        }
    },
};
