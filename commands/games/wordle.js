const { SlashCommandBuilder } = require("discord.js");
const { Wordle } = require("discord-gamecord");

module.exports = {
    data: new SlashCommandBuilder().setName("wordle").setDescription("Play wordle"),

    async execute(interaction) {
        const Game = new Wordle({
            message: interaction,
            isSlashGame: true,
            embed: {
                title: "Wordle",
                color: "#000000",
            },
            customWord: null,
            timeoutTime: 120000,
            winMessage: "You won! The word was **{word}**.",
            loseMessage: "You lost! The word was **{word}**.",
            playerOnlyMessage: "Only {player} can use these buttons.",
        });

        Game.startGame();
    },
};
