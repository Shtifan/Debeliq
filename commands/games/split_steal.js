const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("split_steal")
        .setDescription("Start a split or steal game with another user")
        .addUserOption((option) => option.setName("user").setDescription("The user to play with").setRequired(true)),

    async execute(interaction) {
        const challenger = interaction.user;
        const opponent = interaction.options.getUser("user");

        // Basic validation
        if (opponent.bot) {
            return interaction.reply({ content: "You cannot play with a bot!", ephemeral: true });
        }

        if (opponent.id === challenger.id) {
            return interaction.reply({ content: "You cannot play with yourself!", ephemeral: true });
        }

        // Generate random prize divisible by 1000 between 10000 and 100000
        const minPrize = 10000;
        const maxPrize = 100000;
        const randomNumber = Math.floor(Math.random() * ((maxPrize - minPrize) / 1000 + 1)) * 1000 + minPrize;

        // Create buttons for choices
        const row = {
            type: 1,
            components: [
                {
                    type: 2,
                    custom_id: `split_${challenger.id}_${opponent.id}`,
                    label: "Split",
                    style: 1,
                },
                {
                    type: 2,
                    custom_id: `steal_${challenger.id}_${opponent.id}`,
                    label: "Steal",
                    style: 4,
                },
            ],
        };

        // Send initial messages
        await interaction.reply(`Game started between ${challenger} and ${opponent}! Prize: ${randomNumber} coins 🎰`);

        // Send private messages to both players
        await challenger.send({
            content: `You're playing Split or Steal with ${opponent}! Prize: ${randomNumber} coins\nMake your choice:`,
            components: [row],
        });

        await opponent.send({
            content: `${challenger} has invited you to play Split or Steal! Prize: ${randomNumber} coins\nMake your choice:`,
            components: [row],
        });

        // Store the game data in the button custom_id
        const gameData = {
            challenger: challenger.id,
            opponent: opponent.id,
            prize: randomNumber,
            challengerChoice: null,
            opponentChoice: null,
        };

        // Save game data to the interaction client for temporary storage
        interaction.client.splitStealGames = interaction.client.splitStealGames || new Map();
        interaction.client.splitStealGames.set(`${challenger.id}_${opponent.id}`, gameData);

        // Set timeout to clean up game data after 5 minutes
        setTimeout(() => {
            if (interaction.client.splitStealGames.has(`${challenger.id}_${opponent.id}`)) {
                interaction.client.splitStealGames.delete(`${challenger.id}_${opponent.id}`);
                interaction.channel.send(`The game between ${challenger} and ${opponent} has timed out!`);
            }
        }, 300000);
    },

    // Button interaction handler
    async handleButton(interaction) {
        const [action, challengerId, opponentId] = interaction.customId.split("_");
        const gameKey = `${challengerId}_${opponentId}`;
        const game = interaction.client.splitStealGames?.get(gameKey);

        if (!game) {
            return interaction.reply({ content: "This game has expired or doesn't exist!", ephemeral: true });
        }

        const isChallenger = interaction.user.id === challengerId;
        const isOpponent = interaction.user.id === opponentId;

        if (!isChallenger && !isOpponent) {
            return interaction.reply({ content: "You are not part of this game!", ephemeral: true });
        }

        // Record player's choice
        if (isChallenger && !game.challengerChoice) {
            game.challengerChoice = action;
        } else if (isOpponent && !game.opponentChoice) {
            game.opponentChoice = action;
        } else {
            return interaction.reply({ content: "You have already made your choice!", ephemeral: true });
        }

        await interaction.reply({ content: `You chose to ${action}!`, ephemeral: true });

        // Check if both players have made their choices
        if (game.challengerChoice && game.opponentChoice) {
            const challenger = await interaction.client.users.fetch(challengerId);
            const opponent = await interaction.client.users.fetch(opponentId);

            let resultMessage = "";

            // Calculate results
            if (game.challengerChoice === "split" && game.opponentChoice === "split") {
                resultMessage = `Both players chose to split! ${challenger} and ${opponent} each get ${
                    game.prize / 2
                } coins! 🤝`;
            } else if (game.challengerChoice === "steal" && game.opponentChoice === "steal") {
                resultMessage = `Both players chose to steal! No one gets anything! 😈`;
            } else if (game.challengerChoice === "steal") {
                resultMessage = `${challenger} chose to steal while ${opponent} chose to split! ${challenger} gets ${game.prize} coins! 💰`;
            } else {
                resultMessage = `${opponent} chose to steal while ${challenger} chose to split! ${opponent} gets ${game.prize} coins! 💰`;
            }

            // Send result message to the original channel
            const guild = interaction.client.guilds.cache.find(
                (g) => g.members.cache.has(challengerId) && g.members.cache.has(opponentId)
            );
            const channel = guild.channels.cache.find((ch) =>
                ch.messages.cache.find(
                    (m) => m.content.includes(`Game started between ${challenger}`) && m.content.includes(`${opponent}`)
                )
            );

            if (channel) {
                await channel.send(resultMessage);
            }

            // Clean up game data
            interaction.client.splitStealGames.delete(gameKey);
        }
    },
};
