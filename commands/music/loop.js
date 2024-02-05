const { SlashCommandBuilder } = require("discord.js");
const { useQueue, QueueRepeatMode } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("Enable or disable looping of songs or the whole queue")
        .addStringOption((option) =>
            option
                .setName("action")
                .setDescription("What action you want to preform on the loop")
                .setRequired(true)
                .addChoices(
                    { name: "Song", value: "song" },
                    { name: "Queue", value: "queue" },
                    { name: "Disabled", value: "off" }
                )
        ),

    async execute(interaction) {
        const channel = interaction.member.voice.channel;
        if (!channel) {
            await interaction.reply({
                content: "You are not connected to a voice channel.",
                ephemeral: true,
            });
            return;
        }

        const queue = useQueue(interaction.guild.id);
        if (!queue || !queue.node.isPlaying()) {
            await interaction.reply({
                content: "There is no music currently playing.",
                ephemeral: true,
            });
            return;
        }

        switch (interaction.options.getString("action")) {
            case "song": {
                queue.setRepeatMode(QueueRepeatMode.TRACK);

                await interaction.reply(
                    "Repeat mode **enabled**. The current song will be repeated endlessly (you can end the loop with **/loop Disable**)."
                );
            }
            case "queue": {
                queue.setRepeatMode(QueueRepeatMode.QUEUE);

                await interaction.reply(
                    "Repeat mode **enabled** for the whole queue. It will be repeated endlessly (you can end the loop with **/loop Disable**)."
                );
            }
            case "off": {
                queue.setRepeatMode(QueueRepeatMode.OFF);

                await interaction.reply("Repeat mode **disabled**.");
            }
        }
    },
};
