const { SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playnext")
        .setDescription("Play a song next in the queue")
        .addStringOption((option) => option.setName("query").setDescription("Name or URL of the song").setRequired(true)),

    async execute(interaction) {
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.reply("You are not connected to a voice channel!");
        const query = interaction.options.getString("query", true);

        await interaction.deferReply();

        try {
            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
            });

            if (!searchResult.hasTracks()) {
                return interaction.followUp(`No tracks found for ${query}`);
            }

            const track = searchResult.tracks[0];

            const queue = player.nodes.get(interaction.guildId);

            if (queue) {
                queue.insertTrack(track, 0);
                return interaction.followUp(`**${track.title}** added to the front of the queue!`);
            } else {
                await player.play(channel, track, {
                    nodeOptions: {
                        metadata: interaction,
                    },
                });
                return interaction.followUp(`**${track.title}** is now playing!`);
            }
        } catch (e) {
            return interaction.followUp(`Something went wrong: ${e}`);
        }
    },
};
