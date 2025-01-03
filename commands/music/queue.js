const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Show songs in the queue")
        .addBooleanOption((option) => option.setName("last").setDescription("Show the last 10 songs instead of first 10")),

    async execute(interaction) {
        const channel = interaction.member.voice.channel;
        if (!channel) {
            await interaction.reply({
                content: "You are not connected to a voice channel.",
                ephemeral: true,
            });
            return;
        }

        const queue = useQueue(interaction.guild.id);
        if (!queue || !queue.node.isPlaying()) {
            await interaction.reply({
                content: "There is no music currently playing.",
                ephemeral: true,
            });
            return;
        }

        const showLast = interaction.options.getBoolean("last") ?? false;
        const track = queue.currentTrack;
        const tracksArray = Array.from(queue.tracks.toArray());
        const tracksToShow = showLast ? tracksArray.slice(Math.max(tracksArray.length - 10, 0)) : tracksArray.slice(0, 10);

        const embed = new EmbedBuilder()
            .setAuthor({ name: "Now Playing:" })
            .setTitle(track.title)
            .setURL(track.url)
            .setThumbnail(track.thumbnail)
            .setDescription(
                queue.node.createProgressBar() +
                    "\n\n" +
                    tracksToShow
                        .map((track, i) => {
                            const position = showLast ? tracksArray.length - (tracksToShow.length - i) + 1 : i + 1;
                            return `**#${position}** - Title: **${track.title}** | Uploaded by: **${track.author}**`;
                        })
                        .join("\n")
            );

        await interaction.reply({ embeds: [embed] });
    },
};
