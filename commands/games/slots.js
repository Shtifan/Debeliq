const { SlashCommandBuilder } = require("discord.js");
const { Slots } = require("discord-gamecord");

module.exports = {
    data: new SlashCommandBuilder().setName("slots").setDescription("Play Slots!"),

    async execute(interaction) {
        const Game = new Slots({
            message: interaction,
            isSlashGame: true,
            embed: {
                title: "Slot Machine",
                color: "#5865F2",
            },
            slots: ["🍇", "🍊", "🍋", "🍌"],
        });

        Game.startGame();
    },
};
