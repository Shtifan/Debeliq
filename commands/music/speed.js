const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("speed")
        .setDescription("Speed up or slow down the currently playing song")
        .addNumberOption((option) =>
            option
                .setName("multiplier")
                .setDescription("The speed multiplier (e.g., 1.5 for 1.5x speed)")
                .setRequired(true)
                .setMinValue(0.5)
                .setMaxValue(2.0)
        ),

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

        const speedMultiplier = interaction.options.getNumber("multiplier");

        queue.filters.ffmpeg.setFilters(["atempo=" + speedMultiplier]);

        const embed = new EmbedBuilder()
            .setTitle("Playback Speed Changed")
            .setDescription(`The playback speed has been set to **${speedMultiplier}x**.`)

        await interaction.reply({ embeds: [embed] });
    },
};