const { SlashCommandBuilder } = require("discord.js");
const { Hangman } = require("discord-gamecord");

module.exports = {
    data: new SlashCommandBuilder().setName("hangman").setDescription("Play Hangman!"),

    async execute(interaction) {
        const Game = new Hangman({
            message: interaction,
            isSlashGame: true,
            embed: {
                title: "Hangman",
                color: "#000000",
            },
            hangman: { hat: "🎩", head: "😟", shirt: "👕", pants: "🩳", boots: "👞👞" },
            customWord: null,
            timeoutTime: 120000,
            theme: "nature",
            winMessage: "You won! The word was **{word}**.",
            loseMessage: "You lost! The word was **{word}**.",
            playerOnlyMessage: "Only {player} can use these buttons.",
        });

        Game.startGame();
    },
};
