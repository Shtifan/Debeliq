const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs/promises");

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function readUserData() {
    try {
        const data = await fs.readFile("./user_data.json", "utf8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading user data:", err);
        return {};
    }
}

async function writeUserData(userData) {
    try {
        await fs.writeFile("./user_data.json", JSON.stringify(userData, null, 2), "utf8");
        console.log("User data written successfully.");
    } catch (err) {
        console.error("Error writing user data:", err);
    }
}

module.exports = {
    data: new SlashCommandBuilder().setName("olue").setDescription("Play olue the game"),

    async execute(interaction) {
        const userId = interaction.user.id;
        let userData = await readUserData();

        if (!(userId in userData)) {
            userData[userId] = {
                money: 0,
            };

            await writeUserData(userData);

            const playButton = new ButtonBuilder().setCustomId("play").setLabel("Play").setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(playButton);

            return interaction.reply({
                content:
                    "Hi, it looks like it's your first time playing Olue the Game. Click the play button to start playing",
                components: [row],
            });
        }

        const arrayLength = getRandomNumber(2, 5);
        const uniqueNumbers = new Set();

        while (uniqueNumbers.size < arrayLength) {
            uniqueNumbers.add(getRandomNumber(1, 10));
        }

        const chosenNumbers = Array.from(uniqueNumbers);

        let reply = "";
        for (let i = 0; i < 10; i++) {
            reply += "  _____  ";
        }
        reply += "\n";
        for (let i = 0; i < 10; i++) {
            reply += chosenNumbers.includes(i + 1) ? " |🛢️🛢️| " : " |     | ";
        }
        reply += "\n";
        for (let i = 0; i < 10; i++) {
            reply += chosenNumbers.includes(i + 1) ? " |🛢️🛢️| " : " |     | ";
        }
        reply += "\n";
        for (let i = 0; i < 10; i++) {
            reply += chosenNumbers.includes(i + 1) ? " |🛢️🛢️| " : " |     | ";
        }
        reply += "\n";
        for (let i = 0; i < 10; i++) {
            reply += "  ‾‾‾‾‾  ";
        }
        reply += "\n";
        for (let i = 0; i < 10; i++) {
            reply += `    ${i + 1}    `;
        }

        const numberButtons = [];
        for (let i = 1; i <= 10; i++) {
            const button = new ButtonBuilder()
                .setCustomId(`number_${i}`)
                .setLabel(i.toString())
                .setStyle(ButtonStyle.Primary);
            numberButtons.push(button);
        }

        const firstRowButtons = numberButtons.slice(0, 5);
        const secondRowButtons = numberButtons.slice(5);

        const firstRow = new ActionRowBuilder().addComponents(...firstRowButtons);
        const secondRow = new ActionRowBuilder().addComponents(...secondRowButtons);

        await interaction.reply({
            content: "```" + reply + "```",
            components: [firstRow, secondRow],
        });
    },
};
