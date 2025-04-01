const { SlashCommandBuilder } = require("discord.js");
const { useMainPlayer, QueryType, QueueRepeatMode } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song or playlist")
        .addStringOption((option) =>
            option.setName("query").setDescription("Name or URL of the song or playlist").setRequired(true)
        )
        .addBooleanOption((option) => option.setName("next").setDescription("Add the song next in the queue")),

    async execute(interaction) {
        try {
            const player = useMainPlayer();
            const channel = interaction.member.voice.channel;

            if (!channel) {
                return interaction.reply({
                    content: "You need to be in a voice channel to use this command!",
                    ephemeral: true,
                });
            }

            const permissions = channel.permissionsFor(interaction.guild.members.me);
            if (!permissions.has("Connect") || !permissions.has("Speak")) {
                return interaction.reply({
                    content: "I don't have permission to join or speak in that voice channel!",
                    ephemeral: true,
                });
            }

            const query = interaction.options.getString("query", true);
            const addNext = interaction.options.getBoolean("next") ?? false;

            await interaction.deferReply();

            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO,
            });

            if (!searchResult || !searchResult.tracks.length) {
                return interaction.followUp({
                    content: "No results found!",
                    ephemeral: true,
                });
            }

            const { track, queue } = await player.play(channel, query, {
                nodeOptions: {
                    metadata: interaction,
                    repeatMode: QueueRepeatMode.AUTOPLAY,
                },
                searchEngine: QueryType.AUTO,
                requestedBy: interaction.user,
                position: addNext ? 1 : undefined,
            });

            const response = addNext
                ? `**${track.title}** added next in queue! Autoplay is enabled.`
                : `**${track.title}** enqueued! Autoplay is enabled.`;

            return interaction.followUp(response);
        } catch (error) {
            console.error("Play command error:", error);
            const errorMessage = interaction.deferred ? interaction.followUp : interaction.reply;

            return errorMessage({
                content: `An error occurred while trying to play the song: ${error.message}`,
                ephemeral: true,
            });
        }
    },
};
