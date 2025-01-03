const { SlashCommandBuilder } = require("discord.js");

function convertToMs(days, hours, minutes, seconds) {
    const ms =
        (days || 0) * 24 * 60 * 60 * 1000 +
        (hours || 0) * 60 * 60 * 1000 +
        (minutes || 0) * 60 * 1000 +
        (seconds || 0) * 1000;
    return ms > 0 ? ms : null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout a member from this server")
        .addUserOption((option) => option.setName("user").setDescription("The user you want to timeout").setRequired(true))
        .addIntegerOption((option) => option.setName("days").setDescription("Days for the timeout").setRequired(false))
        .addIntegerOption((option) => option.setName("hours").setDescription("Hours for the timeout").setRequired(false))
        .addIntegerOption((option) => option.setName("minutes").setDescription("Minutes for the timeout").setRequired(false))
        .addIntegerOption((option) => option.setName("seconds").setDescription("Seconds for the timeout").setRequired(false))
        .addStringOption((option) => option.setName("reason").setDescription("The reason for the timeout")),

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

        const days = interaction.options.getInteger("days") || 0;
        const hours = interaction.options.getInteger("hours") || 0;
        const minutes = interaction.options.getInteger("minutes") || 0;
        const seconds = interaction.options.getInteger("seconds") || 0;

        const msDuration = convertToMs(days, hours, minutes, seconds);

        if (!msDuration) {
            await interaction.reply({
                content:
                    "Please provide a valid duration using at least one of the options: days, hours, minutes, or seconds.",
                ephemeral: true,
            });
            return;
        }

        let reason = interaction.options.getString("reason");
        if (!reason) reason = "No reason provided";

        try {
            await targetUser.timeout(msDuration, reason);
            await interaction.reply(
                `${targetUser} was timed out for ${days}d ${hours}h ${minutes}m ${seconds}s.\nReason: ${reason}.`
            );
        } catch (error) {
            await interaction.reply({
                content: `Sorry, I am unable to timeout ${targetUser}.`,
                ephemeral: true,
            });
        }
    },
};
