const { SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('Cows and Bulls')
        .setDescription('Play cows and bulls game'),

    async execute(interaction) {
        
    },
};
