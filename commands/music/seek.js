const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

function timeToMs(time) {
    const parts = time.split(":");
    if (parts.length !== 2) return null;

    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    if (isNaN(minutes) || isNaN(seconds)) return null;

    return minutes * 60 * 1000 + seconds * 1000;
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("seek")
        .setDescription("Seek the player to a specific timestamp")
        .addStringOption((option) =>
            option.setName("timestamp").setDescription("The timestamp to seek to (mm:ss)").setRequired(true)
        ),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        const timestampString = interaction.options.getString("timestamp", true);
        const timestamp = timeToMs(timestampString);

        if (!queue || !queue.currentTrack) {
            await interaction.reply({
                content: "No song is currently playing.",
                ephemeral: true,
            });
            return;
        }

        if (timestamp === null || timestamp > queue.currentTrack.durationMS) {
            await interaction.reply({
                content: `Provide a valid timestamp within 00:00 and ${formatDuration(queue.currentTrack.durationMS)}.`,
                ephemeral: true,
            });
            return;
        }

        queue.node.seek(timestamp);

        await interaction.reply({
            content: `Seeked to ${formatDuration(timestamp)}.`,
        });
    },
};
