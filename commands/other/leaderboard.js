const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const userDataPath = path.join(__dirname, "../../data/user_data.json");

function loadUserData() {
    if (!fs.existsSync(userDataPath)) {
        fs.writeFileSync(userDataPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(userDataPath, "utf8"));
}

module.exports = {
    data: new SlashCommandBuilder().setName("leaderboard").setDescription("View the leaderboard with the top balances"),

    async execute(interaction) {
        const userData = loadUserData();

        const leaderboard = Object.entries(userData)
            .filter(([key, value]) => value.money !== undefined)
            .map(([key, value]) => ({ userId: key, money: value.money }))
            .sort((a, b) => b.money - a.money)
            .slice(0, 10);

        if (leaderboard.length === 0) {
            return await interaction.reply({
                content: "No users with balances found.",
                ephemeral: true,
            });
        }

        const leaderboardMessage = leaderboard
            .map(
                (entry, index) =>
                    `**${index + 1}. <@${entry.userId}>** - ${entry.money.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                    })}`
            )
            .join("\n");

        await interaction.reply({
            content: `**Leaderboard**\n${leaderboardMessage}`,
            ephemeral: true,
        });
    },
};
