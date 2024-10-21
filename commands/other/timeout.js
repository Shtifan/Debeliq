const { SlashCommandBuilder } = require("discord.js");

function convertToMs(duration) {
    const timeUnits = {
        s: 1000,
        m: 1000 * 60,
        h: 1000 * 60 * 60,
        d: 1000 * 60 * 60 * 24,
    };

    const regex = /^(\d+)([smhd])$/;
    const match = duration.match(regex);

    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    return value * timeUnits[unit];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout a member from this server!")
        .addUserOption((option) => option.setName("user").setDescription("The user you want to timeout").setRequired(true))
        .addStringOption((option) =>
            option.setName("duration").setDescription("Timeout duration (10s, 30m, 1h, 5d...)").setRequired(true)
        )
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

        const duration = interaction.options.getString("duration");
        const msDuration = convertToMs(duration);

        if (!msDuration) {
            await interaction.reply({
                content: "Invalid duration format. Please use (e.g., 10s, 30m, 1h, 5d).",
                ephemeral: true,
            });
            return;
        }

        let reason = interaction.options.getString("reason");
        if (!reason) reason = "No reason provided";

        try {
            await targetUser.timeout(msDuration, reason);
            await interaction.reply(`${targetUser} was timed out for ${duration}.\nReason: ${reason}`);
        } catch (error) {
            await interaction.reply({
                content: `Sorry, I am unable to timeout ${targetUser}`,
                ephemeral: true,
            });
        }
    },
};
