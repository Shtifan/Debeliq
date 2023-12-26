const { SlashCommandBuilder } = require('discord.js');
const { Connect4 } = require('discord-gamecord');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('c4')
        .setDescription('Play connect 4')
        .addUserOption(option => option.setName('user').setDescription('Name of the opponent').setRequired(true)),

    async execute(interaction) {
        const Game = new Connect4({
            message: interaction,
            isSlashGame: true,
            opponent: interaction.options.getUser('user'),
            embed: {
                title: 'Connect4 Game',
                statusTitle: 'Status',
                color: '#5865F2',
            },
            emojis: {
                board: '⚪',
                player1: '🔴',
                player2: '🟡',
            },
            mentionUser: true,
            timeoutTime: 60000,
            buttonStyle: 'PRIMARY',
            turnMessage: '{emoji} | Its turn of player **{player}**.',
            winMessage: '{emoji} | **{player}** won the Connect4 Game.',
            tieMessage: 'The Game tied! No one won the Game!',
            timeoutMessage: 'The Game went unfinished! No one won the Game!',
            playerOnlyMessage: 'Only {player} and {opponent} can use these buttons.',
        });

        Game.startGame();
    },
};
