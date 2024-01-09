const { SlashCommandBuilder } = require("discord.js");
const client = require("../index.js");
const fetch = require("node-fetch");
const fs = require("fs");
const { exec } = require("child_process");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stockfish")
        .setDescription("Gives the best chess move based on an image")
        .addAttachmentOption((option) =>
            option.setName("image").setDescription("Attach a chess board image").setRequired(true)
        ),

    async execute(interaction) {
        // Retrieve the image from the interaction options
        const image = interaction.options.getAttachment("image");
        const res = await fetch(image.url);
        const buffer = await res.buffer();
        const imagePath = `./stockfish/board.png`;

        fs.writeFileSync(imagePath, buffer);

        exec("python ./stockfish/main.py", (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing main.py: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Error executing main.py: ${stderr}`);
                return;
            }
        });

        const input = fs.readFileSync("./stockfish/best_moves.txt", "utf-8");
        const arr = input.split("\n");

        let reply = "";
        if (!input.trim()) reply = "No valid chessboard detected";
        else {
            reply += "Best move for white - " + arr[0] + "\n";
            reply += "Best move for black - " + arr[1];
        }

        return interaction.reply(reply);
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const image = message.attachments.first();
    if (!image) return;

    const res = await fetch(image.url);
    const buffer = await res.buffer();
    const imagePath = `./stockfish/board.png`;

    fs.writeFileSync(imagePath, buffer);

    exec("python ./stockfish/main.py", (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing main.py: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error executing main.py: ${stderr}`);
            return;
        }
    });

    const input = fs.readFileSync("./stockfish/best_moves.txt", "utf-8");
    const arr = input.split("\n");

    if (!input.trim()) return;

    let reply = "";
    reply += "Best move for white - " + arr[0] + "\n";
    reply += "Best move for black - " + arr[1];

    return message.reply(reply);
});
