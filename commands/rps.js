const { SlashCommandBuilder } = require("discord.js");
const { RockPaperScissors } = require("discord-gamecord");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Play rock paper scissors")
    .addUserOption((option) => option.setName("user").setDescription("Name of the opponent").setRequired(true)),

  async execute(interaction) {
    const Game = new RockPaperScissors({
      message: interaction,
      isSlashGame: true,
      opponent: interaction.options.getUser("user"),
      embed: {
        title: "Rock Paper Scissors",
        color: "#000000",
        description: "Press a button below to make a choice.",
      },
      buttons: {
        rock: "Rock",
        paper: "Paper",
        scissors: "Scissors",
      },
      emojis: {
        rock: "🌑",
        paper: "📰",
        scissors: "✂️",
      },
      mentionUser: true,
      timeoutTime: 60000,
      buttonStyle: "PRIMARY",
      pickMessage: "You choose {emoji}.",
      winMessage: "**{player}** won the Game! Congratulations!",
      tieMessage: "The Game tied! No one won the Game!",
      timeoutMessage: "The Game went unfinished! No one won the Game!",
      playerOnlyMessage: "Only {player} and {opponent} can use these buttons.",
    });

    Game.startGame();
  },
};
