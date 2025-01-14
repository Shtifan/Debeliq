const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a member from this server")
        .addUserOption((option) => option.setName("user").setDescription("The user you want to kick").setRequired(true))
        .addStringOption((option) => option.setName("reason").setDescription("The reason for the kick")),

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
            await targetUser.kick({ reason });
            await interaction.reply(`User ${targetUser} was kicked\nReason: ${reason}`);
        } catch (error) {
            await interaction.reply({
                content: `Sorry I am unable to kick ${targetUser}`,
                ephemeral: true,
            });
        }
    },
};
