const { SlashCommandBuilder } = require("discord.js");
const { GuessThePokemon } = require("discord-gamecord");

module.exports = {
    data: new SlashCommandBuilder().setName("guess_the_pokemon").setDescription("Play Guess The Pokemon"),

    async execute(interaction) {
        const Game = new GuessThePokemon({
            message: interaction,
            isSlashGame: true,
            embed: {
                title: "Who's The Pokemon",
                color: "#5865F2",
            },
            timeoutTime: 60000,
            winMessage: "You guessed it right! It was a {pokemon}.",
            loseMessage: "Better luck next time! It was a {pokemon}.",
            errMessage: "Unable to fetch pokemon data! Please try again.",
            playerOnlyMessage: "Only {player} can use these buttons.",
        });

        Game.startGame();
    },
};
