const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

function timeToMs(hours, minutes, seconds) {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const s = parseInt(seconds, 10) || 0;

    if (isNaN(h) || isNaN(m) || isNaN(s)) return null;

    return h * 60 * 60 * 1000 + m * 60 * 1000 + s * 1000;
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        : `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("seek")
        .setDescription("Seek the player to a specific timestamp")
        .addIntegerOption((option) => option.setName("hours").setDescription("Hours to seek to"))
        .addIntegerOption((option) => option.setName("minutes").setDescription("Minutes to seek to"))
        .addIntegerOption((option) => option.setName("seconds").setDescription("Seconds to seek to")),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        const hours = interaction.options.getInteger("hours") || 0;
        const minutes = interaction.options.getInteger("minutes") || 0;
        const seconds = interaction.options.getInteger("seconds") || 0;

        const timestamp = timeToMs(hours, minutes, seconds);

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

        const embed = new EmbedBuilder()
            .setAuthor({ name: "Now Playing:" })
            .setTitle(queue.currentTrack.title)
            .setURL(queue.currentTrack.url)
            .setDescription(queue.node.createProgressBar() + `\n\nSeeked to ${formatDuration(timestamp)}.`);

        if (queue.currentTrack.thumbnail && queue.currentTrack.thumbnail.trim() !== "") {
            embed.setThumbnail(queue.currentTrack.thumbnail);
        }

        await interaction.reply({ embeds: [embed] });
    },
};
