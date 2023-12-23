const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder().setName('clear').setDescription('Clears the queue'),

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
                content: `There is no music currently playing`,
                ephemeral: true,
            });

        if (queue.size < 1)
            return interaction.reply({
                content: `There is no music in the queue after the current one`,
                ephemeral: true,
            });

        queue.clear();

        await interaction.reply('The queue has just been cleared 🗑️');
    },
};
