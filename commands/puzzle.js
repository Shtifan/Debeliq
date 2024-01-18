const { SlashCommandBuilder } = require("discord.js");
const client = require("../index.js");
const fetch = require("node-fetch");
const fs = require("fs");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);

async function execute() {
    await execAsync("python ./python/puzzle/main.py");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("puzzle")
        .setDescription("Solves a puzzle")
        .addAttachmentOption((option) => option.setName("image").setDescription("Attach a puzzle image").setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const image = interaction.options.getAttachment("image");
        const res = await fetch(image.url);
        const buffer = await res.buffer();
        const inputPath = "./python/puzzle/input.png";

        fs.writeFileSync(inputPath, buffer);

        await execute();

        const outputPath = "./python/puzzle/output.png";

        if (fs.existsSync(outputPath)) {
            await interaction.followUp({ files: [{ attachment: outputPath }] });
            fs.unlinkSync(outputPath);
        } else {
            await interaction.followUp("Failed to generate the puzzle solution.");
        }
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const image = message.attachments.first();
    if (!image) return;

    const res = await fetch(image.url);
    const buffer = await res.buffer();
    const inputPath = "./python/puzzle/input.png";

    fs.writeFileSync(inputPath, buffer);

    await execute();

    const outputPath = "./python/puzzle/output.png";

    if (fs.existsSync(outputPath)) {
        await message.reply({ files: [{ attachment: outputPath }] });
        fs.unlinkSync(outputPath);
    }
});
