const { SlashCommandBuilder } = require("discord.js");
const ms = require("ms");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeouts a member from this server")
        .addUserOption((option) => option.setName("user").setDescription("The user you want to timeout").setRequired(true))
        .addStringOption((option) =>
            option.setName("duration").setDescription("Timeout duration (10s, 30m, 1h, 5 day...)").setRequired(true)
        )
        .addStringOption((option) => option.setName("reason").setDescription("The reason for the timeout")),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUserId = interaction.options.getUser("user");
        const targetUser = await interaction.guild.members.fetch(targetUserId);

        if (!targetUser) {
            await interaction.reply({
                content: "That user doesn't exist in this server.",
                ephemeral: true,
            });
            return;
        }

        const duration = interaction.options.getString("duration");
        const msDuration = ms(duration);

        let reason = interaction.options.getString("reason");
        if (!reason) reason = "nigger";

        try {
            await targetUser.timeout(msDuration, reason);
            await interaction.editReply(`${targetUser} was timed out for ${duration}.\nReason: ${reason}`);
        } catch (error) {
            await interaction.editReply({
                content: `Sorry I am unable to timeout ${targetUser}`,
                ephemeral: true,
            });
        }
    },
};
