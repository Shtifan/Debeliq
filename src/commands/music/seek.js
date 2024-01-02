const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('The duration to seek to')
        .addIntegerOption(option => option.setName('time').setDescription('Time in seconds').setRequired(true)),

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

        let time = interaction.options.getInteger('time');
        queue.node.seek(time);

        return interaction.reply(`Seeking ${time} seconds through **${queue.currentTrack.title}**`);
    },
};
