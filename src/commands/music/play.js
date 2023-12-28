const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song')
        .addStringOption(option => option.setName('query').setDescription('Name or URL of the song').setRequired(true)),

    async execute(interaction) {
        const player = useMainPlayer();

        const channel = interaction.member.voice.channel;
        if (!channel)
            return interaction.reply({
                content: 'You are not connected to a voice channel',
                ephemeral: true,
            });

        const query = interaction.options.getString('query', true);

        await interaction.deferReply();

        const { track } = await player.play(channel, query, {
            nodeOptions: {
                metadata: interaction,
            },
        });

        return interaction.followUp(`Track **${track.title}** added to queue ✅`);
    },
};
