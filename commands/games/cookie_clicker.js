const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const userCookies = {};

module.exports = {
    data: new SlashCommandBuilder().setName("cookie_clicker").setDescription("Play Cookie Clicker"),

    async execute(interaction) {
        const userId = interaction.user.id;

        if (!userCookies[userId]) {
            userCookies[userId] = 0;
        }

        const embed = new EmbedBuilder()
            .setTitle("🍪 Cookie Clicker 🍪")
            .setDescription(`You have ${userCookies[userId]} cookies!`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("click_cookie").setLabel("🍪 Click me!").setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },

    async handleButton(interaction) {
        if (interaction.customId == "click_cookie") {
            const userId = interaction.user.id;
            userCookies[userId] = (userCookies[userId] || 0) + 1;

            const embed = new EmbedBuilder()
                .setTitle("🍪 Cookie Clicker 🍪")
                .setDescription(`You now have ${userCookies[userId]} cookies!`);

            await interaction.update({ embeds: [embed] });
        }
    },
};
