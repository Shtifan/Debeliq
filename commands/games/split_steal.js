const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");

function formatCurrency(amount) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("split_steal")
        .setDescription("Play Split or Steal")
        .addUserOption((option) =>
            option.setName("opponent").setDescription("The user you want to play against").setRequired(true)
        ),

    async execute(interaction) {
        const opponent = interaction.options.getUser("opponent");

        if (opponent.id === interaction.user.id) {
            return interaction.reply({ content: "You can't play against yourself!", ephemeral: true });
        }
        if (opponent.bot) {
            return interaction.reply({ content: "You can't play against a bot!", ephemeral: true });
        }

        const prize = Math.floor(Math.random() * 91 + 10) * 1000;

        const splitButton = new ButtonBuilder().setCustomId("split").setLabel("SPLIT").setStyle(ButtonStyle.Success);

        const stealButton = new ButtonBuilder().setCustomId("steal").setLabel("STEAL").setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(splitButton, stealButton);

        const gameEmbed = new EmbedBuilder()
            .setTitle("Split or Steal Game")
            .setDescription(
                `${interaction.user} has challenged ${opponent} to a game of Split or Steal!\n\n` +
                    `Prize: **${formatCurrency(prize)}**\n\n` +
                    "Rules:\n" +
                    "• Both players choose to either SPLIT or STEAL\n" +
                    "• If both choose SPLIT, both share the prize equally\n" +
                    "• If one chooses STEAL and one SPLIT, the stealer takes the entire prize\n" +
                    "• If both choose STEAL, neither gets the prize\n\n" +
                    "Make your choice using the buttons below!"
            );

        if (!interaction.client.splitStealGames) {
            interaction.client.splitStealGames = new Map();
        }

        const gameState = {
            player1: {
                id: interaction.user.id,
                choice: null,
            },
            player2: {
                id: opponent.id,
                choice: null,
            },
            prize: prize,
            timeout: null,
        };

        const reply = await interaction.reply({
            embeds: [gameEmbed],
            components: [row],
            fetchReply: true,
        });

        gameState.timeout = setTimeout(() => {
            if (interaction.client.splitStealGames.has(reply.id)) {
                const embed = new EmbedBuilder()
                    .setTitle("Game Expired")
                    .setDescription("The game has expired due to inactivity.");

                reply.edit({ embeds: [embed], components: [] });
                interaction.client.splitStealGames.delete(reply.id);
            }
        }, 60000);

        interaction.client.splitStealGames.set(reply.id, gameState);
    },

    async handleButton(interaction) {
        const gameState = interaction.client.splitStealGames.get(interaction.message.id);
        if (!gameState) return;

        if (interaction.user.id !== gameState.player1.id && interaction.user.id !== gameState.player2.id) {
            return interaction.reply({ content: "This isn't your game!", ephemeral: true });
        }

        const player = interaction.user.id === gameState.player1.id ? "player1" : "player2";
        if (gameState[player].choice) {
            return interaction.reply({ content: "You've already made your choice!", ephemeral: true });
        }

        gameState[player].choice = interaction.customId;
        await interaction.reply({ content: `You chose to ${interaction.customId}!`, ephemeral: true });

        if (gameState.player1.choice && gameState.player2.choice) {
            clearTimeout(gameState.timeout);

            let result;
            const prize = gameState.prize;
            if (gameState.player1.choice === "split" && gameState.player2.choice === "split") {
                result = `Both players chose to SPLIT! Each player gets **${formatCurrency(prize / 2)}**!`;
            } else if (gameState.player1.choice === "steal" && gameState.player2.choice === "split") {
                result = `<@${gameState.player1.id}> chose to STEAL while <@${gameState.player2.id}> chose to SPLIT!\n<@${
                    gameState.player1.id
                }> gets the entire prize of **${formatCurrency(prize)}**!`;
            } else if (gameState.player1.choice === "split" && gameState.player2.choice === "steal") {
                result = `<@${gameState.player2.id}> chose to STEAL while <@${gameState.player1.id}> chose to SPLIT!\n<@${
                    gameState.player2.id
                }> gets the entire prize of **${formatCurrency(prize)}**!`;
            } else {
                result = "Both players chose to STEAL! No one gets the prize!";
            }

            const resultEmbed = new EmbedBuilder().setTitle("Game Results").setDescription(result);

            await interaction.message.edit({ embeds: [resultEmbed], components: [] });
            interaction.client.splitStealGames.delete(interaction.message.id);
        }
    },
};
