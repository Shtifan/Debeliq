const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = require("../../index.js");
const userDataPath = path.join(__dirname, "../../data/user_data.json");

function loadUserData() {
    if (!fs.existsSync(userDataPath)) {
        fs.writeFileSync(userDataPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(userDataPath, "utf8"));
}

function saveUserData(data) {
    fs.writeFileSync(userDataPath, JSON.stringify(data, null, 4));
}

function hasDuplicates(array) {
    return new Set(array).size !== array.length;
}

function ending(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    if (lastDigit == 1 && lastTwoDigits !== 11) return "st";
    if (lastDigit == 2 && lastTwoDigits !== 12) return "nd";
    if (lastDigit == 3 && lastTwoDigits !== 13) return "rd";
    return "th";
}

function generate() {
    let digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let number = "";

    const firstDigitIndex = Math.floor(Math.random() * 9) + 1;
    const firstDigit = digits.splice(firstDigitIndex, 1)[0];
    number += firstDigit;

    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        const digit = digits.splice(randomIndex, 1)[0];
        number += digit;
    }

    return number;
}

function cb(secretNumber, userInput) {
    let bulls = 0;
    let cows = 0;

    for (let i = 0; i < secretNumber.length; i++) {
        if (secretNumber[i] == userInput[i]) {
            bulls++;
        } else if (secretNumber.includes(userInput[i])) {
            cows++;
        }
    }

    return [bulls, cows];
}

let gamestate = false;
let secretNumber;
let guesses;

module.exports = {
    data: new SlashCommandBuilder().setName("cows_bulls").setDescription("Play Cows and Bulls"),

    async execute(interaction) {
        gamestate = true;
        secretNumber = generate();
        guesses = 0;

        await interaction.reply(`I'm ready! Start guessing a 4-digit number.`);
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot || !gamestate) return;

    const input = message.content.split("").map(Number);

    if (isNaN(message.content) || input.length !== 4 || hasDuplicates(input)) return;

    guesses++;

    const [bulls, cows] = cb(secretNumber, input);

    let reply = `**${bulls}** bull${bulls !== 1 ? "s" : ""} and **${cows}** cow${cows !== 1 ? "s" : ""}\n`;

    if (bulls == 4) {
        let prize = 0;

        if (guesses <= 5) {
            prize = 100000;
        } else if (guesses <= 10) {
            prize = 10000;
        }

        reply += `Congratulations! You guessed the number in **${guesses}${ending(guesses)}** attempt!`;

        if (prize > 0) {
            const formattedPrize = prize.toLocaleString("en-US", { style: "currency", currency: "USD" });
            reply += `\nYou won **${formattedPrize}**!`;

            const userData = loadUserData();
            const userId = message.author.id;

            if (userData[userId]) {
                userData[userId].money += prize;
            } else {
                userData[userId] = { money: prize };
            }

            saveUserData(userData);
        } else {
            reply += `\nUnfortunately, you don't win any money.`;
        }

        gamestate = false;
    }

    await message.reply(reply);
});
