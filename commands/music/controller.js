const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder().setName('controller').setDescription('Control your music from the buttons below'),

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

        const back = new ButtonBuilder()
            .setLabel('Back')
            .setCustomId(JSON.stringify({ ffb: 'back' }))
            .setStyle('Primary');

        const skip = new ButtonBuilder()
            .setLabel('Skip')
            .setCustomId(JSON.stringify({ ffb: 'skip' }))
            .setStyle('Primary');

        const resumepause = new ButtonBuilder()
            .setLabel('Resume & Pause')
            .setCustomId(JSON.stringify({ ffb: 'resume&pause' }))
            .setStyle('Danger');

        const save = new ButtonBuilder()
            .setLabel('Save')
            .setCustomId(JSON.stringify({ ffb: 'savetrack' }))
            .setStyle('Success');

        const volumeup = new ButtonBuilder()
            .setLabel('Volume up')
            .setCustomId(JSON.stringify({ ffb: 'volumeup' }))
            .setStyle('Primary');

        const volumedown = new ButtonBuilder()
            .setLabel('Volume Down')
            .setCustomId(JSON.stringify({ ffb: 'volumedown' }))
            .setStyle('Primary');

        const loop = new ButtonBuilder()
            .setLabel('Loop')
            .setCustomId(JSON.stringify({ ffb: 'loop' }))
            .setStyle('Danger');

        const np = new ButtonBuilder()
            .setLabel('Now Playing')
            .setCustomId(JSON.stringify({ ffb: 'nowplaying' }))
            .setStyle('Secondary');

        const queuebutton = new ButtonBuilder()
            .setLabel('Queue')
            .setCustomId(JSON.stringify({ ffb: 'queue' }))
            .setStyle('Secondary');

        const row1 = new ActionRowBuilder().addComponents(back, queuebutton, resumepause, np, skip);
        const row2 = new ActionRowBuilder().addComponents(volumedown, loop, save, volumeup);

        await interaction.reply({ components: [row1, row2] });
    },
};
