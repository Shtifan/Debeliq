const { SlashCommandBuilder } = require('discord.js');
const client = require('../../index.js');

module.exports = {
    data: new SlashCommandBuilder().setName('koj').setDescription('Test command'),

    async execute(interaction) {
        await interaction.reply('te e pital');
    },
};

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.includes('koi') || message.content.includes('koj')) {
        message.reply('te e pital');
    }
});
