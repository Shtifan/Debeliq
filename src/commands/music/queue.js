const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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

        let arr = [];

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle('**Queue**')
            .addFields(
                { value: `**${arr[0]}**` },
                { value: `**${arr[1]}**` },
                { value: `**${arr[2]}**` },
                { value: `**${arr[3]}**` },
                { value: `**${arr[4]}**` }
            );

        return interaction.reply({ embeds: [embed] });
    },
};
