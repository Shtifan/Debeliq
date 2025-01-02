const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { existsSync, mkdirSync } = require("fs");
const fs = require("fs/promises");

async function loadBalances() {
    try {
        if (!existsSync("./data/balances.json")) {
            await saveBalances({});
            return {};
        }
        const data = await fs.readFile("./data/balances.json", "utf8");
        return JSON.parse(data || "{}");
    } catch (error) {
        console.error("Error loading balances:", error);
        return {};
    }
}

async function saveBalances(balances) {
    try {
        if (!existsSync("./data")) mkdirSync("./data", { recursive: true });
        await fs.writeFile("./data/balances.json", JSON.stringify(balances, null, 2));
    } catch (error) {
        console.error("Error saving balances:", error);
    }
}

function formatCurrency(amount) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function generateGrid() {
    return Array.from({ length: 3 }, () =>
        Array.from({ length: 5 }, () => {
            const roll = Math.random() * 100;
            if (roll < 3) return specialSymbols.wild.symbol;
            if (roll < 7) return specialSymbols.scatter.symbol;
            return standardSymbols[Math.floor(Math.random() * standardSymbols.length)].symbol;
        })
    );
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
    ];

    const baseMultiplier = 2.0;
    const wildMultiplier = 2.5;

    for (const payline of paylines) {
        const symbols = payline.map(([row, col]) => grid[row][col]);
        const uniqueSymbols = new Set(symbols);

        if (uniqueSymbols.size <= 2 || (symbols.includes(specialSymbols.wild.symbol) && uniqueSymbols.size <= 2)) {
            const symbol = symbols.find((s) => s !== specialSymbols.wild.symbol) || specialSymbols.wild.symbol;
            const symbolData = [...standardSymbols, ...Object.values(specialSymbols)].find((s) => s.symbol === symbol);

            let win = bet * (symbolData.value / 100) * baseMultiplier;
            if (symbols.includes(specialSymbols.wild.symbol)) win *= wildMultiplier;

            totalWin += win;
            winningCombos.push(
                `Payline (${payline.map(([r, c]) => `[${r + 1}, ${c + 1}]`).join(" -> ")}): ${symbols.join(" ")}`
            );
        }
    }

    const scatterCount = grid.flat().filter((s) => s === specialSymbols.scatter.symbol).length;
    if (scatterCount >= 2) {
        const scatterWin = bet * (scatterCount * 1.5);
        totalWin += scatterWin;
        winningCombos.push(`Scatter: ${scatterCount}x ${specialSymbols.scatter.symbol}`);
    }

    return { totalWin, winningCombos };
}

async function performSpin(interaction, bet, isAutoSpin = false) {
    const userId = interaction.user.id;
    const balances = await loadBalances();

    if (!balances[userId]) balances[userId] = 0;

    if (bet > 0 && balances[userId] < bet) {
        if (isAutoSpin) {
            autoSpinStates.delete(userId);
            await interaction.followUp({
                content: "Auto spin stopped due to insufficient funds!",
                ephemeral: true,
            });
        } else {
            await interaction.followUp({
                content: "You don't have enough money to place this bet!",
                ephemeral: true,
            });
        }
        return false;
    }

    if (bet > 0) balances[userId] -= bet;

    const grid = generateGrid();
    const { totalWin, winningCombos } = calculateWins(grid, bet);

    if (totalWin > 0) balances[userId] += totalWin;
    await saveBalances(balances);

    const gridDisplay = grid.map((row) => row.join(" ")).join("\n");
    const embed = new EmbedBuilder()
        .setTitle(isAutoSpin ? "Slots - Auto Spin" : "Slots")
        .setDescription(
            `**Grid:**\n${gridDisplay}\n\n` +
                `**Bet:** ${formatCurrency(bet)}\n` +
                `**Win:** ${formatCurrency(totalWin)}\n` +
                `**Balance:** ${formatCurrency(balances[userId])}` +
                (winningCombos.length ? `\n\n**Winning Combinations:**\n${winningCombos.join("\n")}` : "")
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`spin_slots_${bet}`).setLabel("Spin Again").setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`auto_slots_${bet}`)
            .setLabel(autoSpinStates.has(userId) ? "Stop Auto" : "Auto Spin")
            .setStyle(autoSpinStates.has(userId) ? ButtonStyle.Danger : ButtonStyle.Success)
    );

    await interaction.editReply({
        embeds: [embed],
        components: [row],
    });

    return true;
}

const standardSymbols = [
    { symbol: "🍒", value: 45 },
    { symbol: "🍋", value: 55 },
    { symbol: "🍉", value: 65 },
    { symbol: "🍇", value: 75 },
    { symbol: "⭐", value: 105 },
    { symbol: "💎", value: 130 },
];

const specialSymbols = {
    wild: { symbol: "🔥", value: 250 },
    scatter: { symbol: "🌟", value: 150 },
};

const autoSpinStates = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("slots")
        .setDescription("Play Slots")
        .addIntegerOption((option) => option.setName("bet").setDescription("Amount to bet").setRequired(true)),

    async execute(interaction) {
        const bet = interaction.options.getInteger("bet");
        await interaction.deferReply();
        await performSpin(interaction, bet);
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
                    } else {
                        autoSpinStates.delete(userId);
                        await performSpin(interaction, bet);
                    }
                }

                autoSpinStates.set(userId, setTimeout(autoSpin, 0));
            }
        }
    },
};
