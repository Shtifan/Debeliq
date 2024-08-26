const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const axios = require("axios");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const client = require("../../index.js");

async function fetchImage(imageAttachment) {
    const response = await axios.get(imageAttachment.url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
}

async function execute() {
    const { stdout, stderr } = await execAsync("python ./commands/other/chess_solver.py");

    if (!stdout) return [];

    const moves = stdout.trim().split("\r\n");
    return moves;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chess_solver")
        .setDescription("Gives the best chess move based on an image using stockfish")
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

        const result = await execute();
        if (result.length == 0) return interaction.followUp("No valid chessboard detected.");

        let best_move = "";
        if (move == "w") best_move = result[0];
        else best_move = result[1];

        await interaction.followUp({ content: `Best move: ${best_move}`, files: [{ attachment: inputPath }] });
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
    reply += "Best move if it is white to play: " + result[0] + "\n";
    reply += "Best move if it is black to play: " + result[1];

    await message.reply(reply);
});
