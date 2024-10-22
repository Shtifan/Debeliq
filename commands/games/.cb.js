const { SlashCommandBuilder } = require("discord.js");
const client = require("../../index.js");

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
        if (secretNumber[i] === userInput[i]) {
            bulls++;
        } else if (secretNumber.includes(userInput[i])) {
            cows++;
        }
    }

    return [bulls, cows];
}

let gamecb = false;
let secretNumber;
let guesses;

module.exports = {
    data: new SlashCommandBuilder().setName("cows_bulls").setDescription("Play Cows and Bulls!"),

    async execute(interaction) {
        gamecb = true;
        secretNumber = generate();
        guesses = 0;

        await interaction.reply(`I'm ready! Start guessing a 4-digit numbers.`);
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot || !gamecb) return;

    const input = message.content.split("").map(Number);

    if (isNaN(message.content) || input.length !== 4 || hasDuplicates(input)) return;

    guesses++;

    const [bulls, cows] = cb(secretNumber, input);

    let reply = `**${bulls}** bull${bulls !== 1 ? "s" : ""} and **${cows}** cow${cows !== 1 ? "s" : ""}\n`;

    if (bulls === 4) {
        reply += `Congratulations! You guessed the number in **${guesses}${ending(guesses)}** attempt!\n`;
        gamecb = false;
    }

    await message.reply(reply);
});
