const { SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song")
        .addStringOption((option) => option.setName("query").setDescription("Name or URL of the song or playlist").setRequired(true)),

    async execute(interaction) {
        const player = useMainPlayer();

        const channel = interaction.member.voice.channel;
        if (!channel) {
            await interaction.reply({
                content: "You are not connected to a voice channel.",
                ephemeral: true,
            });
            return;
        }

        await interaction.deferReply();

        const query = interaction.options.getString("query", true);

        await player.play(channel, query, {
            nodeOptions: {
                metadata: interaction,
            },
        });

        await interaction.followUp("Successfully completed your request.");
    },
};
