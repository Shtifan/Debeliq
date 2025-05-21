const { SlashCommandBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "..", "data");
const userDataPath = path.join(dataDir, "user_data.json");

function ensureDataDir() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function loadUserData() {
    ensureDataDir();
    if (!fs.existsSync(userDataPath)) {
        fs.writeFileSync(userDataPath, JSON.stringify({}), "utf8");
    }
    try {
        return JSON.parse(fs.readFileSync(userDataPath, "utf8"));
    } catch (e) {
        console.error("Error parsing user_data.json, returning empty object:", e);
        fs.writeFileSync(userDataPath, JSON.stringify({}), "utf8");
        return {};
    }
}

function saveUserData(data) {
    ensureDataDir();
    fs.writeFileSync(userDataPath, JSON.stringify(data, null, 4), "utf8");
}

function hasDuplicates(array) {
    return new Set(array).size !== array.length;
}

function ending(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    if (lastDigit === 1 && lastTwoDigits !== 11) return "st";
    if (lastDigit === 2 && lastTwoDigits !== 12) return "nd";
    if (lastDigit === 3 && lastTwoDigits !== 13) return "rd";
    return "th";
}

function generateSecretNumber() {
    let digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let number = "";

    const firstDigitIndex = Math.floor(Math.random() * 9) + 1;
    const firstDigit = digits.splice(digits.indexOf(firstDigitIndex), 1)[0];
    number += firstDigit;

    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        const digit = digits.splice(randomIndex, 1)[0];
        number += digit;
    }
    return number;
}

function calculateCowsAndBulls(secretNumber, userInput) {
    let bulls = 0;
    let cows = 0;
    const secretString = String(secretNumber);
    const inputString = Array.isArray(userInput) ? userInput.join("") : String(userInput);

    for (let i = 0; i < secretString.length; i++) {
        if (secretString[i] === inputString[i]) {
            bulls++;
        } else if (secretString.includes(inputString[i])) {
            cows++;
        }
    }
    return [bulls, cows];
}

module.exports = {
    data: new SlashCommandBuilder().setName("cows_bulls").setDescription("Play Cows and Bulls - guess the 4-digit number!"),

    async execute(interaction, client) {
        if (client.activeGames.has(interaction.channelId)) {
            const existingGame = client.activeGames.get(interaction.channelId);
            if (existingGame.gameType === "cows_bulls") {
                return interaction.reply({
                    content: "A Cows and Bulls game is already active in this channel!",
                    ephemeral: true,
                });
            }
        }

        const secretNumber = generateSecretNumber();
        const gameData = {
            gameType: "cows_bulls",
            userId: interaction.user.id,
            userName: interaction.user.username,
            secretNumber: secretNumber,
            guesses: 0,
            channelId: interaction.channelId,
        };

        client.activeGames.set(interaction.channelId, gameData);

        await interaction.reply(
            `I've generated a 4-digit number (all unique digits, first digit is not zero). ` +
                `You're playing, ${interaction.user.username}!\nType your 4-digit guesses in this channel.`
        );
    },

    utils: {
        loadUserData,
        saveUserData,
        hasDuplicates,
        ending,
        calculateCowsAndBulls,
    },
};
