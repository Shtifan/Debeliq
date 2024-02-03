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

function mainGame(userData, userId) {
    const userMoney = userData[userId].money;
    const durability = userData[userId].durability;

    const arrayLength = getRandomNumber(2, 5);
    const uniqueNumbers = new Set();

    while (uniqueNumbers.size < arrayLength) {
        uniqueNumbers.add(getRandomNumber(1, 10));
    }

    const chosenNumbers = Array.from(uniqueNumbers);

    let reply = "";
    reply += "Money: " + userMoney + "\n";
    reply += "Drill durability: " + durability + "\n";
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
        const button = new ButtonBuilder().setCustomId(`number_${i}`).setLabel(i.toString()).setStyle(ButtonStyle.Primary);
        numberButtons.push(button);
    }

    const firstRowButtons = numberButtons.slice(0, 5);
    const secondRowButtons = numberButtons.slice(5);

    const firstRow = new ActionRowBuilder().addComponents(...firstRowButtons);
    const secondRow = new ActionRowBuilder().addComponents(...secondRowButtons);

    const shop = new ButtonBuilder().setCustomId("shop").setLabel("Shop").setStyle(ButtonStyle.Primary);
    const reset = new ButtonBuilder().setCustomId("reset").setLabel("Reset game").setStyle(ButtonStyle.Danger);
    const miscRow = new ActionRowBuilder().addComponents(shop, reset);

    return { content: "```" + reply + "```", components: [firstRow, secondRow, miscRow] };
}

module.exports = {
    data: new SlashCommandBuilder().setName("olue").setDescription("Play olue the game"),

    async execute(interaction) {
        const userId = interaction.user.id;
        let userData = await readUserData();

        if (!(userId in userData)) {
            userData[userId] = {
                money: 0,
                level: 0,
                durability: 100,
            };

            await writeUserData(userData);

            const playButton = new ButtonBuilder().setCustomId("play").setLabel("Play").setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(playButton);

            const response = await interaction.reply({
                content:
                    "They gave you a drilling machine from Pernik, with which they let you search for olue. Of course Pernichani will steal 60% of your earnings, but your goal is to make a living with this job so you have no choice but to continue. To start drilling for olue, click the button on the corresponding hole. Later in the game you will be able to buy better drills and start mining more valuable olue. Just be careful not to break all drills because you'll have to start over. Have fun.",
                components: [row],
            });

            const collectorFilter = (i) => i.user.id === interaction.user.id;

            const res = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (res.customId === "play") {
                let reply = mainGame(userData, userId);

                return res.update(reply);
            }
        }

        let reply = mainGame(userData, userId);

        await interaction.reply(reply);
    },
};
