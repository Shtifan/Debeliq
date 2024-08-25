const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder().setName("np").setDescription("Shows the song that plays now"),

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

        const track = queue.currentTrack;

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setAuthor({ name: "Now Playing" })
            .setTitle(track.title)
            .setURL(track.url)
            .setThumbnail(track.thumbnail)
            .setDescription(queue.node.createProgressBar());

        await interaction.reply({ embeds: [embed] });
    },
};
