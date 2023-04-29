const { SlashCommandBuilder } = require('discord.js');
const { useQueue, QueueRepeatMode } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Enable or disable looping of songs or the whole queue')
        .addStringOption(option =>
            option
                .setName('action')
                .setDescription('What action you want to preform on the loop')
                .setRequired(true)
                .addChoices(
                    { name: 'Song', value: 'enable_loop_song' },
                    { name: 'Queue', value: 'enable_loop_queue' },
                    { name: 'Disabled', value: 'disable_loop' }
                )
        ),

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

        switch (interaction.options.getString('action')) {
            case 'enable_loop_song': {
                queue.setRepeatMode(QueueRepeatMode.TRACK);

                return interaction.reply(
                    `Repeat mode **enabled**. The current song will be repeated endlessly (you can end the loop with **/loop Disable**) 🔁`
                );
            }
            case 'enable_loop_queue': {
                queue.setRepeatMode(QueueRepeatMode.QUEUE);

                return interaction.reply(
                    `Repeat mode **enabled** for the whole queue. It will be repeated endlessly (you can end the loop with **/loop Disable**) 🔁`
                );
            }
            case 'disable_loop': {
                queue.setRepeatMode(QueueRepeatMode.OFF);

                return interaction.reply(`Repeat mode **disabled**`);
            }
        }
    },
};
