const { SlashCommandBuilder } = require("discord.js");
const { useMainPlayer, QueueRepeatMode } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song")
        .addStringOption((option) =>
            option.setName("query").setDescription("Name or URL of the song or playlist").setRequired(true)
        )
        .addBooleanOption((option) => option.setName("next").setDescription("Add the song next in the queue")),

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
        const nextInQueue = interaction.options.getBoolean("next") ?? false;

        const queue = player.nodes.create(interaction.guild, {
            metadata: interaction,
        });

        if (!queue.connection) {
            await queue.connect(channel);
        }

        if (queue.repeatMode !== QueueRepeatMode.AUTOPLAY) {
            queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
        }

        const result = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: "auto",
        });

        if (result.tracks.length === 0) {
            await interaction.followUp("No results found.");
            return;
        }

        if (nextInQueue) {
            queue.insertTrack(result.tracks[0], 0);
        } else {
            queue.addTrack(result.tracks[0]);
        }

        if (!queue.isPlaying()) {
            await queue.node.play();
        }

        await interaction.followUp("Successfully completed your request. Autoplay is enabled by default.");
    },
};
