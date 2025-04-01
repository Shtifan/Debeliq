const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { existsSync, mkdirSync } = require("fs");
const fs = require("fs/promises");
const path = require("path");

const userDataPath = "./data/user_data.json";

async function ensureDataDir() {
    try {
        const dataDir = "./data";
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function loadBalances() {
    try {
        await ensureDataDir();
        try {
            await fs.access(userDataPath);
        } catch {
            await fs.writeFile(userDataPath, JSON.stringify({}));
        }
        const data = await fs.readFile(userDataPath, "utf8");
        return JSON.parse(data || "{}");
    } catch (error) {
        console.error("Error loading balances:", error);
        return {};
    }
}

async function saveBalances(balances) {
    try {
        await ensureDataDir();
        await fs.writeFile(userDataPath, JSON.stringify(balances, null, 2));
    } catch (error) {
        console.error("Error saving balances:", error);
        throw new Error("Failed to save balances");
    }
}

function formatCurrency(amount) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function calculateWins(grid, bet) {
    let totalWin = 0;
    let winningCombos = [];

    const paylines = [
        [
            [0, 0],
            [0, 1],
            [0, 2],
            [0, 3],
            [0, 4],
        ],
        [
            [1, 0],
            [1, 1],
            [1, 2],
            [1, 3],
            [1, 4],
        ],
        [
            [2, 0],
            [2, 1],
            [2, 2],
            [2, 3],
            [2, 4],
        ],
        [
            [0, 0],
            [1, 1],
            [2, 2],
            [1, 3],
            [0, 4],
        ],
        [
            [2, 0],
            [1, 1],
            [0, 2],
            [1, 3],
            [2, 4],
        ],
        [
            [0, 0],
            [0, 1],
            [1, 2],
            [2, 3],
            [2, 4],
        ],
        [
            [2, 0],
            [2, 1],
            [1, 2],
            [0, 3],
            [0, 4],
        ],
        [
            [1, 0],
            [0, 1],
            [0, 2],
            [0, 3],
            [1, 4],
        ],
        [
            [1, 0],
            [2, 1],
            [2, 2],
            [2, 3],
            [1, 4],
        ],
        [
            [0, 0],
            [1, 1],
            [2, 2],
        ],
        [
            [2, 0],
            [1, 1],
            [0, 2],
        ],
        [
            [1, 1],
            [1, 2],
            [1, 3],
        ],
        [
            [0, 2],
            [1, 2],
            [2, 2],
        ],
        [
            [1, 0],
            [1, 1],
            [1, 4],
        ],
        [
            [0, 3],
            [1, 3],
            [2, 3],
        ],
    ];

    for (let paylineIndex = 0; paylineIndex < paylines.length; paylineIndex++) {
        const payline = paylines[paylineIndex];
        const symbols = payline.map(([row, col]) => grid[row][col]);

        let consecutiveCount = 1;
        let currentSymbol = symbols[0];
        let wildCount = currentSymbol === specialSymbols.wild.symbol ? 1 : 0;

        for (let i = 1; i < symbols.length; i++) {
            if (
                symbols[i] === currentSymbol ||
                symbols[i] === specialSymbols.wild.symbol ||
                (currentSymbol === specialSymbols.wild.symbol && symbols[i] !== specialSymbols.scatter.symbol)
            ) {
                consecutiveCount++;
                if (symbols[i] === specialSymbols.wild.symbol) wildCount++;
            } else break;
        }

        if (consecutiveCount >= 3) {
            const symbolData =
                currentSymbol === specialSymbols.wild.symbol
                    ? symbols.find((s) => s !== specialSymbols.wild.symbol) || specialSymbols.wild.symbol
                    : currentSymbol;
            const symbolInfo = [...standardSymbols, specialSymbols.wild, specialSymbols.scatter].find(
                (s) => s.symbol === symbolData
            );

            if (symbolInfo) {
                let multiplier = consecutiveCount >= 5 ? 5 : consecutiveCount >= 4 ? 3 : 2;

                if (wildCount > 0) {
                    multiplier *= 1 + wildCount * 0.25;
                }

                const win = bet * (symbolInfo.value / 100) * multiplier;
                totalWin += win;

                winningCombos.push({
                    paylineIndex: paylineIndex + 1,
                    symbols: symbols.slice(0, consecutiveCount).join(" "),
                    matches: consecutiveCount,
                    win: win,
                    multiplier,
                });
            }
        }
    }

    const scatterCount = grid.flat().filter((s) => s === specialSymbols.scatter.symbol).length;
    if (scatterCount >= 3) {
        const scatterMultiplier = scatterCount >= 5 ? 20 : scatterCount >= 4 ? 10 : 5;
        const scatterWin = bet * scatterMultiplier;
        totalWin += scatterWin;
        winningCombos.push({
            type: "scatter",
            count: scatterCount,
            win: scatterWin,
        });
    }

    const volatilityFactor = 0.85;
    totalWin = Math.round(totalWin * volatilityFactor);

    return { totalWin, winningCombos };
}

function generateGrid() {
    return Array.from({ length: 3 }, () =>
        Array.from({ length: 5 }, () => {
            const roll = Math.random() * 100;
            if (roll < 0.5) return specialSymbols.wild.symbol;
            if (roll < 0.75) return specialSymbols.scatter.symbol;

            const weightedRoll = Math.random() * 1000;
            let cumulative = 0;
            for (const symbol of standardSymbols) {
                cumulative += 5000 / symbol.value;
                if (weightedRoll < cumulative) return symbol.symbol;
            }
            return standardSymbols[standardSymbols.length - 1].symbol;
        })
    );
}

async function performSpin(interaction, bet, isAutoSpin = false) {
    try {
        const userId = interaction.user.id;
        const balances = await loadBalances();

        if (!balances[userId]) {
            balances[userId] = { money: 0 };
        }

        if (bet <= 0) {
            const errorMessage = interaction.deferred ? interaction.editReply : interaction.reply;
            await errorMessage({
                content: "Please enter a valid bet amount greater than 0!",
                ephemeral: true,
            });
            return false;
        }

        if (balances[userId].money < bet) {
            if (isAutoSpin) {
                autoSpinStates.delete(userId);
                const errorMessage = interaction.deferred ? interaction.editReply : interaction.reply;
                await errorMessage({
                    content: "Auto spin stopped due to insufficient funds!",
                    ephemeral: true,
                });
                const grid = generateGrid();
                const { totalWin, winningCombos } = calculateWins(grid, bet);
                await updateUI(interaction, grid, bet, totalWin, balances[userId].money, winningCombos, false);
            } else {
                const errorMessage = interaction.deferred ? interaction.editReply : interaction.reply;
                await errorMessage({
                    content: "You don't have enough money to place this bet!",
                    ephemeral: true,
                });
            }
            return false;
        }

        balances[userId].money -= bet;

        const grid = generateGrid();
        const { totalWin, winningCombos } = calculateWins(grid, bet);

        if (totalWin > 0) {
            balances[userId].money += totalWin;
        }

        await saveBalances(balances);

        await updateUI(interaction, grid, bet, totalWin, balances[userId].money, winningCombos, autoSpinStates.has(userId));

        return true;
    } catch (error) {
        console.error("Error in performSpin:", error);
        const errorMessage = interaction.deferred ? interaction.editReply : interaction.reply;
        await errorMessage({
            content: "An error occurred while processing your spin. Please try again later.",
            ephemeral: true,
        });
        return false;
    }
}

async function updateUI(interaction, grid, bet, totalWin, balance, winningCombos, isAutoSpinActive) {
    const gridDisplay = grid.map((row) => row.join(" ")).join("\n");

    const formattedCombos = winningCombos
        .map((combo) => {
            if (combo.type === "scatter") {
                return `Scatter: ${combo.count} symbols, Win: ${formatCurrency(combo.win)}`;
            } else {
                return (
                    `Payline ${combo.paylineIndex}: ${combo.symbols} (${combo.matches} matches), ` +
                    `Multiplier: x${combo.multiplier.toFixed(2)}, Win: ${formatCurrency(combo.win)}`
                );
            }
        })
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle(isAutoSpinActive ? "Slots - Auto Spin" : "Slots")
        .setDescription(
            `**Grid:**\n${gridDisplay}\n\n` +
                `**Bet:** ${formatCurrency(bet)}\n` +
                `**Win:** ${formatCurrency(totalWin)}\n` +
                `**Balance:** ${formatCurrency(balance)}` +
                (formattedCombos ? `\n\n**Winning Combinations:**\n${formattedCombos}` : "")
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`spin_slots_${bet}`).setLabel("Spin Again").setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`auto_slots_${bet}`)
            .setLabel(isAutoSpinActive ? "Stop Auto" : "Auto Spin")
            .setStyle(isAutoSpinActive ? ButtonStyle.Danger : ButtonStyle.Success)
    );

    await interaction.editReply({
        embeds: [embed],
        components: [row],
    });
}

const standardSymbols = [
    { symbol: "7️⃣", value: 100, name: "Seven" },
    { symbol: "💎", value: 75, name: "Diamond" },
    { symbol: "🔔", value: 50, name: "Bell" },
    { symbol: "🍇", value: 30, name: "Grapes" },
    { symbol: "🍊", value: 25, name: "Orange" },
    { symbol: "🍋", value: 20, name: "Lemon" },
    { symbol: "🍒", value: 15, name: "Cherry" },
];

const specialSymbols = {
    wild: { symbol: "⭐", value: 500, name: "Wild" },
    scatter: { symbol: "🎰", value: 200, name: "Scatter" },
};

const autoSpinStates = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("slots")
        .setDescription("Play the slots game")
        .addIntegerOption((option) =>
            option.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(1)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            const bet = interaction.options.getInteger("bet");
            await performSpin(interaction, bet);
        } catch (error) {
            console.error("Error in slots command:", error);
            const errorMessage = interaction.deferred ? interaction.editReply : interaction.reply;
            await errorMessage({
                content: "An error occurred while processing your request. Please try again later.",
                ephemeral: true,
            });
        }
    },

    async handleButton(interaction) {
        const userId = interaction.user.id;
        const [action, betString] = interaction.customId.split("_slots_");
        const bet = parseInt(betString, 10);

        await interaction.deferUpdate();

        if (action === "spin") {
            await performSpin(interaction, bet);
        } else if (action === "auto") {
            if (autoSpinStates.has(userId)) {
                clearTimeout(autoSpinStates.get(userId));
                autoSpinStates.delete(userId);
                await performSpin(interaction, bet);
            } else {
                async function autoSpin() {
                    if (!autoSpinStates.has(userId)) return;

                    const success = await performSpin(interaction, bet, true);
                    if (success) {
                        autoSpinStates.set(userId, setTimeout(autoSpin, 2000));
                    }
                }

                autoSpinStates.set(userId, setTimeout(autoSpin, 0));
            }
        }
    },
};
