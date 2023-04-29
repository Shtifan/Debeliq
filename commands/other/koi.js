const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('koi').setDescription('Test command'),

    async execute(interaction) {
        await interaction.reply('te e pital');
    },
};
