const { SlashCommandBuilder } = require("discord.js");
const client = require("../../index.js");

function hasDuplicates(array) {
    return new Set(array).size != array.length;
}

function ending(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    switch (lastDigit) {
        case 1:
            if (lastTwoDigits != 11) return "st";
            break;
        case 2:
            if (lastTwoDigits != 12) return "nd";
            break;
        case 3:
            if (lastTwoDigits != 13) return "rd";
            break;
    }
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

function cb(number, input) {
    let bulls = 0;
    let cows = 0;
    for (i = 0; i < number.length; i++) {
        if (number[i] == input[i]) bulls++;
        else if (number.indexOf(input[i]) != -1) cows++;
    }
    return [bulls, cows];
}

let gamecb = false;

module.exports = {
    data: new SlashCommandBuilder().setName("cb").setDescription("Play cows and bulls"),

    async execute(interaction) {
        gamecb = true;
        number = generate();
        guesses = 0;

        await interaction.reply(`I'm ready`);
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!gamecb) return;

    let input = message.content.split("").map(Number);
    if (isNaN(message.content) || input.length != 4 || hasDuplicates(input)) return;
    guesses++;

    let [bulls, cows] = cb(number, input);

    let reply = "";
    reply += `**${bulls}** bull${bulls != 1 ? "s" : ""} **${cows}** cow${cows != 1 ? "s" : ""}\n`;
    if (bulls == 4) {
        reply += `Well done, you guessed the number from the **${guesses + ending(guesses)}** attempt!\n`;
        gamecb = false;
    }

    await message.reply(reply);
});
