const { SlashCommandBuilder } = require("discord.js");
const { useQueue, QueueRepeatMode } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autoplay")
        .setDescription("Toggle autoplaying related songs based on your queue"),

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

        const autoplay = queue.repeatMode === QueueRepeatMode.AUTOPLAY;
        queue.setRepeatMode(autoplay ? QueueRepeatMode.OFF : QueueRepeatMode.AUTOPLAY);

        await interaction.reply(`Autoplay has been ${autoplay ? "disabled" : "enabled"}.`);
    },
};
