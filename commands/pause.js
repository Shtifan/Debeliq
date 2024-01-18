const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

let isPaused = false;

module.exports = {
    data: new SlashCommandBuilder().setName("pause").setDescription("Pause or resume the queue"),

    async execute(interaction) {
        const channel = interaction.member.voice.channel;
        if (!channel)
            return interaction.reply({
                content: "You are not connected to a voice channel",
                ephemeral: true,
            });

        const queue = useQueue(interaction.guild.id);
        if (!queue)
            return interaction.reply({
                content: `There is no music currently playing`,
                ephemeral: true,
            });

        if (!isPaused) {
            queue.node.pause();
            isPaused = true;
            await interaction.reply("Music was paused successfully");
        } else {
            queue.node.resume();
            isPaused = false;
            await interaction.reply("Music was resumed successfully");
        }
    },
};
