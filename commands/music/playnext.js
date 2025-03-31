const { SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playnext")
        .setDescription("Add a song to the front of the queue")
        .addStringOption((option) => option.setName("query").setDescription("Name or URL of the song").setRequired(true)),

    async execute(interaction) {
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.reply("You are not connected to a voice channel!");
        const query = interaction.options.getString("query", true);

        await interaction.deferReply();

        try {
            const { track, queue } = await player.play(channel, query, {
                nodeOptions: {
                    metadata: interaction,
                },
            });

            queue.tracks.splice(0, 0, queue.tracks.pop());

            return interaction.followUp(`**${track.title}** added to the front of the queue!`);
        } catch (e) {
            return interaction.followUp(`Something went wrong: ${e}`);
        }
    },
};
