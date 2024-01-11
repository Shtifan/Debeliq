const { SlashCommandBuilder } = require("discord.js");
const client = require("../index.js");
const fetch = require("node-fetch");
const fs = require("fs");
const { exec } = require("child_process");

function execute() {
    exec("python ./chessbot/main.py", (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing main.py: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error executing main.py: ${stderr}`);
            return;
        }
    });
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

        fs.writeFileSync("./chessbot/result.txt", "");
        execute();

        const input = fs.readFileSync("./chessbot/result.txt", "utf-8");
        fs.unlinkSync("./chessbot/result.txt");

        const arr = input.split("\n");

        let reply = "";
        if (!input.trim()) {
            reply = "No valid chessboard detected";
        } else {
            reply += "Best move for white - " + arr[0] + "\n";
            reply += "Best move for black - " + arr[1];
        }

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

    fs.writeFileSync("./chessbot/result.txt", "");
    execute();

    const input = fs.readFileSync("./chessbot/result.txt", "utf-8");
    const arr = input.split("\n");

    if (!input.trim()) return;

    let reply = "";
    reply += "Best move for white - " + arr[0] + "\n";
    reply += "Best move for black - " + arr[1];

    await message.reply(reply);

    fs.unlinkSync("./chessbot/result.txt");
});
