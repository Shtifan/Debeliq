const { SlashCommandBuilder } = require("discord.js");

function convertToMs(days, hours, minutes, seconds) {
    return days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
}

function formatDuration(days, hours, minutes, seconds) {
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    return parts.join(" ");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout a user")
        .addUserOption((option) => option.setName("user").setDescription("The user to timeout").setRequired(true))
        .addIntegerOption((option) => option.setName("days").setDescription("Number of days").setMinValue(0).setMaxValue(28))
        .addIntegerOption((option) =>
            option.setName("hours").setDescription("Number of hours").setMinValue(0).setMaxValue(24)
        )
        .addIntegerOption((option) =>
            option.setName("minutes").setDescription("Number of minutes").setMinValue(0).setMaxValue(60)
        )
        .addIntegerOption((option) =>
            option.setName("seconds").setDescription("Number of seconds").setMinValue(0).setMaxValue(60)
        )
        .addStringOption((option) => option.setName("reason").setDescription("Reason for the timeout").setMaxLength(1000)),

    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has("ModerateMembers")) {
                await interaction.reply({
                    content: "You don't have permission to timeout members.",
                    ephemeral: true,
                });
                return;
            }

            const targetUser = interaction.options.getMember("user");
            if (!targetUser) {
                await interaction.reply({
                    content: "That user doesn't exist in this server.",
                    ephemeral: true,
                });
                return;
            }

            if (!targetUser.moderatable) {
                await interaction.reply({
                    content: "I cannot timeout this user. They may have a higher role than me or be the server owner.",
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

            if (msDuration > 28 * 24 * 60 * 60 * 1000) {
                await interaction.reply({
                    content: "Timeout duration cannot exceed 28 days.",
                    ephemeral: true,
                });
                return;
            }

            let reason = interaction.options.getString("reason");
            if (!reason) reason = "No reason provided";

            reason = `${reason} (Timeout by ${interaction.user.tag})`;

            try {
                await targetUser.timeout(msDuration, reason);
                const formattedDuration = formatDuration(days, hours, minutes, seconds);

                await interaction.reply({
                    content: `${targetUser} has been timed out for ${formattedDuration}.\nReason: ${reason}`,
                    ephemeral: true,
                });
            } catch (error) {
                console.error("Error applying timeout:", error);
                await interaction.reply({
                    content: `Failed to timeout ${targetUser}. Please check my permissions and try again.`,
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.error("Error in timeout command:", error);
            await interaction.reply({
                content: "An error occurred while processing your request. Please try again later.",
                ephemeral: true,
            });
        }
    },
};
