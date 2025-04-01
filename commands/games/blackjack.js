const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const userDataPath = "./data/user_data.json";

function ensureDataDir() {
    const dataDir = "./data";
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function loadUserData() {
    ensureDataDir();
    if (!fs.existsSync(userDataPath)) {
        fs.writeFileSync(userDataPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(userDataPath, "utf8"));
}

function saveUserData(data) {
    ensureDataDir();
    fs.writeFileSync(userDataPath, JSON.stringify(data, null, 4));
}

function createDeck() {
    const suits = ["♠", "♣", "♥", "♦"];
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const deck = [];

    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank });
        }
    }

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
        if (card.rank === "A") {
            aces++;
            value += 11;
        } else if (["J", "Q", "K"].includes(card.rank)) {
            value += 10;
        } else {
            value += parseInt(card.rank);
        }
    }

    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

function formatCard(card) {
    return `${card.rank}${card.suit}`;
}

function formatHand(hand, hideFirst = false) {
    if (hideFirst) {
        return `[??] ${hand.slice(1).map(formatCard).join(" ")}`;
    }
    return hand.map(formatCard).join(" ");
}

const gameStates = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("Play Blackjack")
        .addIntegerOption((option) =>
            option.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(1)
        ),

    async execute(interaction) {
        const bet = interaction.options.getInteger("bet");
        const userData = loadUserData();
        const userId = interaction.user.id;

        if (!userData[userId] || userData[userId].money < bet) {
            return interaction.reply({ content: "You don't have enough money!", ephemeral: true });
        }

        userData[userId].money -= bet;
        saveUserData(userData);

        const deck = createDeck();
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        const gameState = {
            deck,
            playerHand,
            dealerHand,
            bet,
            gameActive: true,
            canDouble: true,
            canSurrender: true,
        };

        gameStates.set(userId, gameState);

        const embed = new EmbedBuilder()
            .setTitle("Blackjack")
            .addFields(
                { name: "Your Hand", value: `${formatHand(playerHand)} (${calculateHandValue(playerHand)})` },
                { name: "Dealer's Hand", value: formatHand(dealerHand, true) },
                { name: "Bet", value: `$${bet}` }
            );

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("hit").setLabel("Hit").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("stand").setLabel("Stand").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("double")
                .setLabel("Double")
                .setStyle(ButtonStyle.Success)
                .setDisabled(!gameState.canDouble),
            new ButtonBuilder()
                .setCustomId("surrender")
                .setLabel("Surrender")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(!gameState.canSurrender)
        );

        await interaction.reply({ embeds: [embed], components: [buttons] });
    },

    async handleButton(interaction) {
        const userId = interaction.user.id;
        const gameState = gameStates.get(userId);
        if (!gameState || !gameState.gameActive) return;

        const userData = loadUserData();
        let embed = new EmbedBuilder().setTitle("Blackjack");
        let components = [];

        const action = interaction.customId;
        let description = "";

        if (action === "hit") {
            gameState.playerHand.push(gameState.deck.pop());
            gameState.canDouble = false;
            gameState.canSurrender = false;

            const playerValue = calculateHandValue(gameState.playerHand);

            if (playerValue > 21) {
                description = "Bust! You went over 21.";
                gameState.gameActive = false;
                userData[userId].money -= gameState.bet;
            }
        } else if (action === "stand") {
            gameState.gameActive = false;
        } else if (action === "double") {
            if (userData[userId].money < gameState.bet) {
                return interaction.reply({ content: "You don't have enough to double!", ephemeral: true });
            }

            userData[userId].money -= gameState.bet;
            gameState.bet *= 2;
            gameState.playerHand.push(gameState.deck.pop());
            gameState.gameActive = false;
        } else if (action === "surrender") {
            userData[userId].money += Math.floor(gameState.bet / 2);
            description = "You surrendered. You get half your bet back.";
            gameState.gameActive = false;
        }

        if (!gameState.gameActive) {
            let dealerValue = calculateHandValue(gameState.dealerHand);

            while (dealerValue < 17) {
                gameState.dealerHand.push(gameState.deck.pop());
                dealerValue = calculateHandValue(gameState.dealerHand);
            }

            const playerValue = calculateHandValue(gameState.playerHand);
            const dealerBust = dealerValue > 21;

            if (action !== "surrender") {
                if (playerValue > 21) {
                    description = "You bust! Dealer wins.";
                } else if (dealerBust) {
                    description = "Dealer busts! You win!";
                    userData[userId].money += gameState.bet * 2;
                } else if (playerValue > dealerValue) {
                    description = "You win!";
                    userData[userId].money += gameState.bet * 2;
                } else if (playerValue === dealerValue) {
                    description = "Push! You get your bet back.";
                    userData[userId].money += gameState.bet;
                } else {
                    description = "Dealer wins!";
                }
            }

            if (playerValue === 21 && gameState.playerHand.length === 2) {
                description = "Blackjack! You win 3:2!";
                userData[userId].money += Math.floor(gameState.bet * 2.5);
            }

            saveUserData(userData);
            gameStates.delete(userId);
        }

        embed.addFields(
            {
                name: "Your Hand",
                value: `${formatHand(gameState.playerHand)} (${calculateHandValue(gameState.playerHand)})`,
            },
            {
                name: "Dealer's Hand",
                value: `${formatHand(gameState.dealerHand)} (${calculateHandValue(gameState.dealerHand)})`,
            },
            { name: "Bet", value: `$${gameState.bet}` }
        );

        if (description) {
            embed.setDescription(description);
        }

        if (gameState.gameActive) {
            components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("hit").setLabel("Hit").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("stand").setLabel("Stand").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId("double")
                        .setLabel("Double")
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(!gameState.canDouble),
                    new ButtonBuilder()
                        .setCustomId("surrender")
                        .setLabel("Surrender")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(!gameState.canSurrender)
                ),
            ];
        }

        await interaction.update({ embeds: [embed], components });
    },
};
