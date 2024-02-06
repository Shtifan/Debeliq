const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs/promises");

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

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generate(userMoney, durability) {
    const arrayLength = getRandomNumber(2, 5);
    const uniqueNumbers = new Set();

    while (uniqueNumbers.size < arrayLength) {
        uniqueNumbers.add(getRandomNumber(1, 10));
    }

    const chosenNumbers = Array.from(uniqueNumbers);

    let reply = "";

    reply += `Money: ${userMoney}\n`;
    reply += `Drill durability: ${durability}\n`;
    reply += `${"  _____  ".repeat(10)}\n`;
    reply += `${Array.from({ length: 3 }, (_, i) =>
        Array.from({ length: 10 }, (_, j) => (chosenNumbers.includes(j + 1) ? " |🛢️🛢️| " : " |     | ")).join("")
    ).join("\n")}\n`;
    reply += `${"  ‾‾‾‾‾  ".repeat(10)}\n`;
    reply += `${Array.from({ length: 10 }, (_, i) => `    ${i + 1}    `).join("")}\n`;

    const numberButtons = Array.from({ length: 10 }, (_, i) =>
        new ButtonBuilder()
            .setCustomId(`number_${i + 1}`)
            .setLabel((i + 1).toString())
            .setStyle(ButtonStyle.Primary)
    );

    const firstRowButtons = numberButtons.slice(0, 5);
    const secondRowButtons = numberButtons.slice(5);

    const firstRow = new ActionRowBuilder().addComponents(...firstRowButtons);
    const secondRow = new ActionRowBuilder().addComponents(...secondRowButtons);

    const shop = new ButtonBuilder().setCustomId("shop").setLabel("Shop").setStyle(ButtonStyle.Primary);
    const reset = new ButtonBuilder().setCustomId("reset").setLabel("Reset game").setStyle(ButtonStyle.Danger);
    const miscRow = new ActionRowBuilder().addComponents(shop, reset);

    return {
        content: "```" + reply + "```",
        components: [firstRow, secondRow, miscRow],
    };
}

async function mainGame(userData, userId, interaction) {
    const userMoney = userData[userId].money;
    const durability = userData[userId].durability;

    const message = await interaction.reply(generate(userMoney, durability));
    const specialNumbers = generate(userMoney, durability);

    const filter = (buttonInteraction) =>
        buttonInteraction.user.id === userId && buttonInteraction.customId.startsWith("number_");

    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000,
    });

    collector.on("collect", async (buttonInteraction) => {
        const selectedNumber = parseInt(buttonInteraction.customId.split("_")[1]);
        userData[userId].durability -= 1;

        if (specialNumbers.includes(selectedNumber)) userData[userId].money += 10;

        await writeUserData(userData);

        remove(message, selectedNumber);
    });
}

module.exports = {
    data: new SlashCommandBuilder().setName("olue").setDescription("Play Olue the Game"),

    async execute(interaction) {
        const userId = interaction.user.id;
        let userData = await readUserData();

        const playButton = new ButtonBuilder().setCustomId("play").setLabel("Play").setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder().addComponents(playButton);

        const intro = `Hi, it looks like it's your first time playing Olue the Game. So, they gave you a drilling machine from Pernik, with which they let you search for olue. Of course Pernichani will steal 60% of your earnings, but your goal is to make a living with this job so you have no choice but to continue playing. To start drilling for olue, click the button on the corresponding hole. Later in the game you will be able to buy better drills and start mining more valuable olue. Just be careful not to break all drills because you'll have to start over. Have fun. Click the play button to start playing.`;

        if (!(userId in userData)) {
            userData[userId] = {
                money: 0,
                durability: 100,
            };

            await writeUserData(userData);

            await interaction.reply({
                content: intro,
                components: [row],
            });

            const filter = (click) => click.user.id === interaction.user.id;

            const collector = interaction.channel.createMessageComponentCollector({
                max: 1,
                time: 60000,
                filter,
            });

            collector.on("collect", async (interaction) => {
                await mainGame(userData, userId, interaction);
            });
        } else await mainGame(userData, userId, interaction);
    },
};
