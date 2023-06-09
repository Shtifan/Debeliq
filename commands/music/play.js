const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song')
        .addStringOption(option => option.setName('song').setDescription('Name or URL of the song').setRequired(true)),

    async execute(interaction) {
        const player = useMainPlayer();

        const channel = interaction.member.voice.channel;
        if (!channel)
            return interaction.reply({
                content: 'You are not connected to a voice channel',
                ephemeral: true,
            });

        const query = interaction.options.getString('song', true);
        const searchResult = await player.search(query, {
            requestedBy: interaction.user,
        });

        await interaction.deferReply();
        if (!searchResult.hasTracks()) {
            return interaction.editReply({
                content: `I found no tracks for ${query}`,
                ephemeral: true,
            });
        } else {
            await player.play(channel, searchResult, {
                nodeOptions: {
                    metadata: interaction,
                },
            });

            await interaction.editReply(`Loading your track...`);
        }
    },
};
