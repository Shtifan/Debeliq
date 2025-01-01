const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { existsSync, mkdirSync } = require("fs");
const fs = require("fs/promises");

async function loadUserData() {
    try {
        if (!existsSync("./data/user_data.json")) {
            await saveUserData({});
            return {};
        }
        const data = await fs.readFile("./data/user_data.json", "utf8");
        return JSON.parse(data || "{}");
    } catch (error) {
        console.error("Error loading user data:", error);
        return {};
    }
}

async function saveUserData(userData) {
    try {
        if (!existsSync("./data")) mkdirSync("./data", { recursive: true });
        await fs.writeFile("./data/user_data.json", JSON.stringify(userData, null, 2));
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}

function formatCurrency(amount) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function calculateWins(grid, bet) {
    let totalWin = 0;
    let winningCombos = [];

    const baseMultiplier = 1.2;
    const wildMultiplier = 2.5;

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const currentSymbols = grid[row].slice(col, col + 3);
            const uniqueSymbols = new Set(currentSymbols);

            if (
                uniqueSymbols.size === 1 ||
                (currentSymbols.includes(specialSymbols.wild.symbol) && uniqueSymbols.size <= 2)
            ) {
                const symbol = currentSymbols.find((s) => s !== specialSymbols.wild.symbol) || specialSymbols.wild.symbol;
                const symbolData = [...standardSymbols, ...Object.values(specialSymbols)].find((s) => s.symbol === symbol);

                let win = bet * (symbolData.value / 100) * baseMultiplier;
                if (currentSymbols.includes(specialSymbols.wild.symbol)) win *= wildMultiplier;

                totalWin += win;
                winningCombos.push(`Row ${row + 1}: ${currentSymbols.join(" ")}`);
            }
        }
    }

    for (let col = 0; col < 5; col++) {
        const currentSymbols = [grid[0][col], grid[1][col], grid[2][col]];
        const uniqueSymbols = new Set(currentSymbols);

        if (uniqueSymbols.size === 1 || (currentSymbols.includes(specialSymbols.wild.symbol) && uniqueSymbols.size <= 2)) {
            const symbol = currentSymbols.find((s) => s !== specialSymbols.wild.symbol) || specialSymbols.wild.symbol;
            const symbolData = [...standardSymbols, ...Object.values(specialSymbols)].find((s) => s.symbol === symbol);

            let win = bet * (symbolData.value / 100) * 1.8;
            if (currentSymbols.includes(specialSymbols.wild.symbol)) win *= wildMultiplier;

            totalWin += win;
            winningCombos.push(`Column ${col + 1}: ${currentSymbols.join(" ")}`);
        }
    }

    const scatterCount = grid.flat().filter((s) => s === specialSymbols.scatter.symbol).length;
    if (scatterCount >= 3) {
        const scatterWin = bet * (scatterCount * 1.0);
        totalWin += scatterWin;
        winningCombos.push(`Scatter: ${scatterCount}x ${specialSymbols.scatter.symbol}`);
    }

    const bonusCount = grid.flat().filter((s) => s === specialSymbols.bonus.symbol).length;
    if (bonusCount >= 3) {
        const bonusWin = bet * (bonusCount * 1.25);
        totalWin += bonusWin;
        winningCombos.push(`Bonus: ${bonusCount}x ${specialSymbols.bonus.symbol}`);
    }

    return { totalWin, winningCombos };
}

function generateGrid() {
    return Array.from({ length: 3 }, () =>
        Array.from({ length: 5 }, () => {
            const roll = Math.random() * 100;
            if (roll < 3) return specialSymbols.wild.symbol;
            if (roll < 6) return specialSymbols.scatter.symbol;
            if (roll < 9) return specialSymbols.bonus.symbol;
            return standardSymbols[Math.floor(Math.random() * standardSymbols.length)].symbol;
        })
    );
}

const standardSymbols = [
    { symbol: "🍒", value: 25 },
    { symbol: "🍋", value: 35 },
    { symbol: "🍉", value: 45 },
    { symbol: "🍇", value: 55 },
    { symbol: "🎰", value: 65 },
    { symbol: "⭐", value: 85 },
    { symbol: "💎", value: 110 },
    { symbol: "🍀", value: 130 },
    { symbol: "7️⃣", value: 160 },
];

const specialSymbols = {
    wild: { symbol: "🔥", value: 220 },
    scatter: { symbol: "🌟", value: 120 },
    bonus: { symbol: "🎉", value: 170 },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("slots")
        .setDescription("Play Slots")
        .addIntegerOption((option) => option.setName("bet").setDescription("Amount to bet").setRequired(true)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userData = await loadUserData();
        if (!userData[userId]) userData[userId] = { money: 0 };

        const bet = interaction.options.getInteger("bet");

        if (userData[userId].money < bet) {
            return interaction.reply({ content: "Insufficient funds!", ephemeral: true });
        }

        userData[userId].money -= bet;

        const grid = generateGrid();
        const { totalWin, winningCombos } = calculateWins(grid, bet);
        userData[userId].money += totalWin;
        await saveUserData(userData);

        const gridDisplay = grid.map((row) => row.join(" ")).join("\n");
        const embed = new EmbedBuilder()
            .setTitle("Slots")
            .setDescription(
                `**Grid:**\n${gridDisplay}\n\n` +
                    `**Bet:** ${formatCurrency(bet)}\n` +
                    `**Win:** ${formatCurrency(totalWin)}\n` +
                    `**Balance:** ${formatCurrency(userData[userId].money)}` +
                    (winningCombos.length ? `\n\n**Winning Combinations:**\n${winningCombos.join("\n")}` : "")
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`spin_slots_${bet}`).setLabel("Spin Again").setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },

    async handleButton(interaction) {
        const [command, betString] = interaction.customId.split("_slots_");
        if (command !== "spin") return;

        const bet = parseInt(betString);
        const userId = interaction.user.id;

        const originalUserId = interaction.message.interaction.user.id;
        if (userId !== originalUserId) {
            return interaction.reply({ content: "You are not allowed to interact with this button.", ephemeral: true });
        }

        const userData = await loadUserData();

        if (userData[userId].money < bet) {
            return interaction.reply({ content: "Insufficient funds!", ephemeral: true });
        }

        userData[userId].money -= bet;

        const grid = generateGrid();
        const { totalWin, winningCombos } = calculateWins(grid, bet);
        userData[userId].money += totalWin;
        await saveUserData(userData);

        const gridDisplay = grid.map((row) => row.join(" ")).join("\n");
        const embed = new EmbedBuilder()
            .setTitle("Slots")
            .setDescription(
                `**Grid:**\n${gridDisplay}\n\n` +
                    `**Bet:** ${formatCurrency(bet)}\n` +
                    `**Win:** ${formatCurrency(totalWin)}\n` +
                    `**Balance:** ${formatCurrency(userData[userId].money)}` +
                    (winningCombos.length ? `\n\n**Winning Combinations:**\n${winningCombos.join("\n")}` : "")
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`spin_slots_${bet}`).setLabel("Spin Again").setStyle(ButtonStyle.Primary)
        );

        await interaction.update({ embeds: [embed], components: [row] });
    },
};
