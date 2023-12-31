const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder().setName('queue').setDescription('Shows the next 5 songs in the queue'),

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

        console.log(queue);
    },
};
