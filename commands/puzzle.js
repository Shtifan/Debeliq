const { SlashCommandBuilder } = require("discord.js");
const client = require("../index.js");
const fetch = require("node-fetch");
const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

async function execute() {
    await exec("python ./python/puzzle/main.py");
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
        const imagePath = "./python/puzzle/image.png";

        fs.writeFileSync(imagePath, buffer);

        await execute();

        const outputPath = "./python/puzzle/output.png";
        return interaction.followUp({ files: [{ attachment: outputPath }] });
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const image = message.attachments.first();
    if (!image) return;

    const res = await fetch(image.url);
    const buffer = await res.buffer();
    const imagePath = "./python/puzzle/image.png";

    fs.writeFileSync(imagePath, buffer);

    await execute();

    const outputPath = "./python/puzzle/output.png";
    return message.reply({ files: [{ attachment: outputPath }] });
});
