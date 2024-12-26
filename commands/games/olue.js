const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs/promises");
const { existsSync, mkdirSync } = require("fs");

async function saveUserData(userData) {
    try {
        if (!existsSync("./data")) {
            mkdirSync("./data", { recursive: true });
        }
        await fs.writeFile("./data/user_data.json", JSON.stringify({ olue_game: userData }, null, 2), "utf8");
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}

async function loadUserData() {
    try {
        if (!existsSync("./data/user_data.json")) {
            await saveUserData({});
            return {};
        }

        const data = await fs.readFile("./data/user_data.json", "utf8");

        if (!data.trim()) {
            await saveUserData({});
            return {};
        }

        const parsedData = JSON.parse(data);
        return parsedData.olue_game || {};
    } catch (error) {
        console.error("Error loading user data:", error);
        await saveUserData({});
        return {};
    }
}

function rng(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSpecialNumbers() {
    const gridSize = Math.max(2, rng(2, 5));
    const uniqueNumbers = new Set();

    while (uniqueNumbers.size < gridSize) {
        uniqueNumbers.add(rng(1, 10));
    }

    return Array.from(uniqueNumbers);
}

function createGameGrid(score = 0, specialNumbers = null, selectedCells = new Set()) {
    const currentSpecialNumbers = specialNumbers || generateSpecialNumbers();

    const gridOutput = [
        `Score: ${score}`,
        `${"  _____  ".repeat(10)}`,
        `${Array.from({ length: 3 }, () =>
            Array.from({ length: 10 }, (_, colIndex) =>
                selectedCells.has(colIndex + 1)
                    ? " |XXXXX| "
                    : currentSpecialNumbers.includes(colIndex + 1)
                    ? " |OOOOO| "
                    : " |     | "
            ).join("")
        ).join("\n")}`,
        `${"  ‾‾‾‾‾  ".repeat(10)}`,
        `${Array.from({ length: 10 }, (_, i) => `    ${i + 1}    `).join("")}`,
    ].join("\n");

    const numberButtons = Array.from({ length: 10 }, (_, index) =>
        new ButtonBuilder()
            .setCustomId(`number_${index + 1}`)
            .setLabel(`${index + 1}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(selectedCells.has(index + 1))
    );

    const buttonRows = [
        new ActionRowBuilder().addComponents(...numberButtons.slice(0, 5)),
        new ActionRowBuilder().addComponents(...numberButtons.slice(5)),
    ];

    return {
        content: "```" + gridOutput + "```",
        components: buttonRows,
        specialNumbers: currentSpecialNumbers,
    };
}

const gameStates = new Map();

class GameState {
    constructor() {
        this.score = 0;
        this.selectedCells = new Set();
        this.specialNumbers = generateSpecialNumbers();
    }

    reset() {
        this.score = 0;
        this.selectedCells = new Set();
        this.specialNumbers = generateSpecialNumbers();
    }
}

module.exports = {
    data: new SlashCommandBuilder().setName("olue").setDescription("Play Olue the Game"),

    async execute(interaction) {
        const userId = interaction.user.id;
        let userData = await loadUserData();

        if (!userData[userId]) {
            userData[userId] = { score: 0 };
            await saveUserData(userData);

            const startButton = new ButtonBuilder()
                .setCustomId("start")
                .setLabel("Start Game")
                .setStyle(ButtonStyle.Primary);
            const startRow = new ActionRowBuilder().addComponents(startButton);

            const introText = `Hi, it looks like it's your first time playing Olue the Game. So, they gave you a drilling machine from Pernik, with which they let you search for olue. Of course Pernichani will steal 60% of your earnings, but your goal is to make a living with this job so you have no choice but to continue playing. To start drilling for olue, click the button on the corresponding hole. Later in the game you will be able to buy better drills and start mining more valuable olue. Just be careful not to break all drills because you'll have to start over. Have fun. Click the button to start playing.`;

            await interaction.reply({
                content: introText,
                components: [startRow],
            });
        } else {
            const gameState = new GameState();
            gameStates.set(userId, gameState);

            const { content, components } = createGameGrid(0, gameState.specialNumbers);
            await interaction.reply({ content, components });
        }
    },

    async handleButton(interaction) {
        const userId = interaction.user.id;
        let userData = await loadUserData();
        let gameState = gameStates.get(userId);

        if (!gameState) {
            gameState = new GameState();
            gameStates.set(userId, gameState);
        }

        const customId = interaction.customId;

        try {
            if (customId === "start") {
                gameState.reset();
                const { content, components } = createGameGrid(0, gameState.specialNumbers);
                await interaction.update({ content, components });
                return;
            }

            if (customId === "retry") {
                gameState.reset();
                const { content, components } = createGameGrid(0, gameState.specialNumbers);
                await interaction.update({ content, components });
                return;
            }

            if (customId.startsWith("number_")) {
                const chosenNumber = parseInt(customId.split("_")[1]);

                if (gameState.specialNumbers.includes(chosenNumber)) {
                    gameState.selectedCells.add(chosenNumber);
                    userData[userId].score += 1;
                    gameState.score = userData[userId].score;
                    await saveUserData(userData);

                    if (gameState.specialNumbers.every((num) => gameState.selectedCells.has(num))) {
                        gameState.selectedCells.clear();
                        gameState.specialNumbers = generateSpecialNumbers();
                        const { content, components } = createGameGrid(gameState.score, gameState.specialNumbers);
                        await interaction.update({ content, components });
                    } else {
                        const { content, components } = createGameGrid(
                            gameState.score,
                            gameState.specialNumbers,
                            gameState.selectedCells
                        );
                        await interaction.update({ content, components });
                    }
                } else {
                    const finalScore = gameState.score;
                    gameState.reset();
                    userData[userId].score = 0;
                    await saveUserData(userData);

                    const retryButton = new ButtonBuilder()
                        .setCustomId("retry")
                        .setLabel("Retry")
                        .setStyle(ButtonStyle.Primary);
                    const retryRow = new ActionRowBuilder().addComponents(retryButton);

                    await interaction.update({
                        content: `\`\`\`Game Over! Your final score is ${finalScore}\`\`\``,
                        components: [retryRow],
                    });
                }
            }
        } catch (error) {
            console.error("Error in handleButton:", error);
            await interaction.reply({
                content: "There was an error processing your move. Please try again.",
                ephemeral: true,
            });
        }
    },
};
