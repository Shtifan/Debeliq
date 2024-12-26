const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a member from this server")
        .addUserOption((option) => option.setName("user").setDescription("The user you want to ban").setRequired(true))
        .addStringOption((option) => option.setName("reason").setDescription("The reason for the ban")),

    async execute(interaction) {
        const targetUserId = interaction.options.getUser("user");
        const targetUser = await interaction.guild.members.fetch(targetUserId);

        if (!targetUser) {
            await interaction.reply({
                content: "That user doesn't exist in this server.",
                ephemeral: true,
            });
            return;
        }

        let reason = interaction.options.getString("reason");
        if (!reason) reason = "nigger";

        try {
            await targetUser.ban({ reason });
            await interaction.reply(`User ${targetUser} was banned\nReason: ${reason}`);
        } catch (error) {
            await interaction.reply({
                content: `Sorry I am unable to ban ${targetUser}`,
                ephemeral: true,
            });
        }
    },
};
