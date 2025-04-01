const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

const userDataPath = "./data/user_data.json";

function ensureDataDir() {
    const dataDir = "./data";
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function loadUserData() {
    ensureDataDir();
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

        let leaderboardMessage = "**Balance Leaderboard**\n";

        for (const [index, entry] of leaderboard.entries()) {
            try {
                const user = await interaction.client.users.fetch(entry.userId);
                leaderboardMessage += `**${index + 1}. ${user.username}** - ${entry.money.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                })}\n`;
            } catch (error) {
                console.error(`Could not fetch user with ID ${entry.userId}:`, error);
                leaderboardMessage += `**${index + 1}. Unknown User** - ${entry.money.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                })}\n`;
            }
        }

        await interaction.reply(leaderboardMessage);
    },
};
