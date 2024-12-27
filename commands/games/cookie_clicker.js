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

        if (!data.trim()) {
            await saveUserData({});
            return {};
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading user data:", error);
        await saveUserData({});
        return {};
    }
}

async function saveUserData(userData) {
    try {
        if (!existsSync("./data")) {
            mkdirSync("./data", { recursive: true });
        }
        await fs.writeFile("./data/user_data.json", JSON.stringify(userData, null, 2), "utf8");
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}

module.exports = {
    data: new SlashCommandBuilder().setName("cookie_clicker").setDescription("Play Cookie Clicker"),

    async execute(interaction) {
        const userId = interaction.user.id;
        let userData = await loadUserData();

        if (!userData.cookie_clicker) {
            userData.cookie_clicker = {};
        }
        if (!userData.cookie_clicker[userId]) {
            userData.cookie_clicker[userId] = {
                cookies: 0,
            };
            await saveUserData(userData);
        }

        const embed = new EmbedBuilder()
            .setTitle("🍪 Cookie Clicker 🍪")
            .setDescription(`You have ${userData.cookie_clicker[userId].cookies} cookies!`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("click_cookie").setLabel("🍪 Click me!").setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },

    async handleButton(interaction) {
        if (interaction.customId === "click_cookie") {
            const userId = interaction.user.id;
            let userData = await loadUserData();

            if (!userData.cookie_clicker) {
                userData.cookie_clicker = {};
            }
            if (!userData.cookie_clicker[userId]) {
                userData.cookie_clicker[userId] = {
                    cookies: 0,
                };
            }

            userData.cookie_clicker[userId].cookies++;

            await saveUserData(userData);

            const embed = new EmbedBuilder()
                .setTitle("🍪 Cookie Clicker 🍪")
                .setDescription(`You now have ${userData.cookie_clicker[userId].cookies} cookies!`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("click_cookie").setLabel("🍪 Click me!").setStyle(ButtonStyle.Primary)
            );

            await interaction.update({ embeds: [embed], components: [row] });
        }
    },
};
