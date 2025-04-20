const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout a member for a specified duration.")
        .addUserOption(option =>
            option
                .setName("target")
                .setDescription("The member to timeout.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("duration")
                .setDescription("Timeout duration (e.g. 1m, 10m, 1h, 1d)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Reason for timeout.")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const member = interaction.options.getMember("target");
        const durationStr = interaction.options.getString("duration");
        const reason = interaction.options.getString("reason") || "No reason provided.";

        const regex = /^(\d+)([smhd])$/i;
        const match = durationStr.match(regex);
        if (!match) {
            await interaction.reply({
                content: "Invalid duration format. Use s, m, h, or d (e.g. 10m, 1h, 1d).",
                ephemeral: true,
            });
            return;
        }
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        let ms = 0;
        switch (unit) {
            case 's': ms = value * 1000; break;
            case 'm': ms = value * 60 * 1000; break;
            case 'h': ms = value * 60 * 60 * 1000; break;
            case 'd': ms = value * 24 * 60 * 60 * 1000; break;
            default:
                await interaction.reply({
                    content: "Invalid duration unit. Use s, m, h, or d.",
                    ephemeral: true,
                });
                return;
        }
        if (!member.moderatable || member.user.bot) {
            await interaction.reply({
                content: "I cannot timeout this member.",
                ephemeral: true,
            });
            return;
        }
        try {
            await member.timeout(ms, reason);
            await interaction.reply({
                content: `⏳ ${member.user.tag} has been timed out for ${durationStr}. Reason: ${reason}`,
                ephemeral: false,
            });
        } catch (error) {
            await interaction.reply({
                content: `Failed to timeout member: ${error}`,
                ephemeral: true,
            });
        }
    },
};
