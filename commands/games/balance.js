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

async function saveUserData(data) {
    try {
        await ensureDataDir();
        await fs.writeFile(userDataPath, JSON.stringify(data, null, 4), "utf8");
    } catch (error) {
        console.error("Error saving user data:", error);
        throw new Error("Failed to save user data");
    }
}

module.exports = {
    data: new SlashCommandBuilder().setName("balance").setDescription("Check your current balance"),

    async execute(interaction) {
        const userData = await loadUserData();
        const userId = interaction.user.id;

        if (!userData[userId]) {
            userData[userId] = { money: 0 };
            await saveUserData(userData);
        }

        const balance = userData[userId].money;

        await interaction.reply(`Your current balance is: **${balance}**.`);
    },
};
