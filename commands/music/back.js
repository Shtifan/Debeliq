const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder().setName('back').setDescription('Go back the song before'),

    async execute(interaction) {
        const channel = interaction.member.voice.channel;
        if (!channel)
            return interaction.reply({
                content: 'You are not connected to a voice channel',
                ephemeral: true,
            });

        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.node.isPlaying())
            return interaction.reply({
                content: 'There is no music currently playing',
                ephemeral: true,
            });

        try {
            await queue.history.back();
        } catch (error) {
            return interaction.reply({
                content: 'There is no previous track in the queue',
                ephemeral: true,
            });
        }
        await interaction.reply(`Playing the previous track 🎵`);
    },
};
