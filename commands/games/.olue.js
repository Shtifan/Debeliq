const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs/promises");
const { existsSync, mkdirSync } = require("fs");

async function saveUserData(userData) {
    try {
        if (!existsSync("./data")) {
            mkdirSync("./data", { recursive: true });
        }
        await fs.writeFile("./data/olue_data.json", JSON.stringify(userData, null, 2), "utf8");
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}

async function loadUserData() {
    try {
        if (!existsSync("./data/olue_data.json")) {
            await saveUserData({});
            return {};
        }

        const data = await fs.readFile("./data/olue_data.json", "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading user data:", error);
        return {};
    }
}

function rng(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createGameGrid(score, specialNumbers) {
    const gridSize = rng(2, 5);
    const uniqueNumbers = new Set();

    while (uniqueNumbers.size < gridSize) {
        uniqueNumbers.add(rng(1, 10));
    }

    specialNumbers = specialNumbers || Array.from(uniqueNumbers);

    let gridOutput = "";
    gridOutput += `Score: ${score}\n`;
    gridOutput += `${"  _____  ".repeat(10)}\n`;
    gridOutput += `${Array.from({ length: 3 }, (_) =>
        Array.from({ length: 10 }, (_, colIndex) =>
            specialNumbers.includes(colIndex + 1) ? " |OOOOO| " : " |     | "
        ).join("")
    ).join("\n")}\n`;
    gridOutput += `${"  ‾‾‾‾‾  ".repeat(10)}\n`;
    gridOutput += `${Array.from({ length: 10 }, (_, i) => `    ${i + 1}    `).join("")}\n`;

    const numberButtons = Array.from({ length: 10 }, (_, index) =>
        new ButtonBuilder()
            .setCustomId(`number_${index + 1}`)
            .setLabel(`${index + 1}`)
            .setStyle(ButtonStyle.Primary)
    );

    const buttonRows = [
        new ActionRowBuilder().addComponents(...numberButtons.slice(0, 5)),
        new ActionRowBuilder().addComponents(...numberButtons.slice(5)),
    ];

    return {
        content: "```" + gridOutput + "```",
        components: buttonRows,
        specialNumbers,
    };
}

async function updateMessage(message, score, specialNumbers, isGameOver = false) {
    const { content, components } = createGameGrid(score, specialNumbers);

    if (isGameOver) {
        const retryButton = new ButtonBuilder().setCustomId("retry").setLabel("Retry").setStyle(ButtonStyle.Primary);
        const retryRow = new ActionRowBuilder().addComponents(retryButton);

        await message.edit({ content: `Game Over! Your final score is ${score}`, components: [retryRow] });
    } else {
        await message.edit({ content, components });
    }
}

async function startGame(userData, userId, interaction) {
    let currentScore = userData[userId]?.score || 0;

    let { content, components, specialNumbers } = createGameGrid(currentScore);

    let correctSelections = new Set();

    let gameMessage;
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
        gameMessage = await interaction.editReply({ content, components });
    } else {
        gameMessage = await interaction.editReply({ content, components });
    }

    const filter = (buttonInteraction) =>
        buttonInteraction.user.id === userId &&
        (buttonInteraction.customId.startsWith("number_") || buttonInteraction.customId === "retry");
    const collector = gameMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (buttonInteraction) => {
        const customId = buttonInteraction.customId;

        if (customId.startsWith("number_")) {
            const chosenNumber = parseInt(buttonInteraction.customId.split("_")[1]);

            if (specialNumbers.includes(chosenNumber)) {
                userData[userId].score += 1;
                correctSelections.add(chosenNumber);

                if (correctSelections.size === specialNumbers.length) {
                    correctSelections.clear();
                    ({ content, components, specialNumbers } = createGameGrid(userData[userId].score));
                    await updateMessage(gameMessage, userData[userId].score, specialNumbers);
                } else {
                    await saveUserData(userData);
                    await updateMessage(gameMessage, userData[userId].score, specialNumbers);
                }
            } else {
                await updateMessage(gameMessage, userData[userId].score, specialNumbers, true);
                collector.stop();
            }

            await buttonInteraction.deferUpdate();
        }

        if (customId === "retry") {
            userData[userId].score = 0;
            await saveUserData(userData);
            await startGame(userData, userId, interaction);
        }
    });

    collector.on("end", async (collected) => {
        if (collected.size === 0) {
            await gameMessage.edit({ content: "Time's up! No selection was made.", components: [] });
        }
    });
}

module.exports = {
    data: new SlashCommandBuilder().setName("olue").setDescription("Play Olue the Game"),

    async execute(interaction) {
        const userId = interaction.user.id;
        let userData = await loadUserData();

        const startButton = new ButtonBuilder().setCustomId("play").setLabel("Play").setStyle(ButtonStyle.Primary);
        const startRow = new ActionRowBuilder().addComponents(startButton);

        const introText = `Hi, it looks like it's your first time playing Olue the Game. So, they gave you a drilling machine from Pernik, with which they let you search for olue. Of course Pernichani will steal 60% of your earnings, but your goal is to make a living with this job so you have no choice but to continue playing. To start drilling for olue, click the button on the corresponding hole. Later in the game you will be able to buy better drills and start mining more valuable olue. Just be careful not to break all drills because you'll have to start over. Have fun. Click the play button to start playing.`;

        if (!userData[userId]) {
            userData[userId] = { score: 0 };
            await saveUserData(userData);

            const introMessage = await interaction.reply({ content: introText, components: [startRow] });
            const buttonFilter = (btn) => btn.user.id === interaction.user.id;

            const introCollector = introMessage.createMessageComponentCollector({
                max: 1,
                time: 60000,
                filter: buttonFilter,
            });

            introCollector.on("collect", async () => {
                await startGame(userData, userId, interaction);
            });
        } else {
            await startGame(userData, userId, interaction);
        }
    },
};
