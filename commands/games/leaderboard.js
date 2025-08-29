const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const userDataPath = path.join(dataDir, "user_data.json");

async function ensureDataDir() {
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch {}
}

async function loadUserData() {
    try {
        await ensureDataDir();
        try {
            await fs.access(userDataPath);
        } catch {
            await fs.writeFile(userDataPath, JSON.stringify({}), "utf8");
        }
        const data = await fs.readFile(userDataPath, "utf8");
        return JSON.parse(data || "{}");
    } catch (error) {
        console.error("Error loading user data:", error);
        return {};
    }
}

module.exports = {
    data: new SlashCommandBuilder().setName("leaderboard").setDescription("View the leaderboard with the top balances"),

    async execute(interaction) {
        const userData = await loadUserData();

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
                leaderboardMessage += `**${index + 1}. ${user.username}** - ${entry.money}\n`;
            } catch (error) {
                console.error(`Could not fetch user with ID ${entry.userId}:`, error);
                leaderboardMessage += `**${index + 1}. Unknown User** - ${entry.money}\n`;
            }
        }

        await interaction.reply(leaderboardMessage);
    },
};
