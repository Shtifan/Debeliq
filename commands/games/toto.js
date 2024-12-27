const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

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

function generate() {
    const uniqueNumbers = [];
    while (uniqueNumbers.length < 6) {
        const randomNumber = Math.floor(Math.random() * 49) + 1;
        if (!uniqueNumbers.includes(randomNumber)) {
            uniqueNumbers.push(randomNumber);
        }
    }
    return uniqueNumbers;
}

function check(correctGuesses) {
    switch (correctGuesses) {
        case 6:
            return "Congratulations! You win **$7 000 000**!";
        case 5:
            return "Congratulations! You win **$10 000**!";
        case 4:
            return "Congratulations! You win **$100**!";
        case 3:
            return "Congratulations! You win **$10**!";
        case 2:
            return "Congratulations! You win **$1**!";
        case 1:
            return "Congratulations! You win **$0,01**!";
        default:
            return `Sorry, you didn't win anything.`;
    }
}

function notUnique(array) {
    return new Set(array).size !== array.length;
}

function notInRange(array) {
    return array.some((number) => number < 1 || number > 49);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("toto")
        .setDescription("Play Toto 6/49")
        .addIntegerOption((option) => option.setName("1st").setDescription("Number between 1 and 49").setRequired(true))
        .addIntegerOption((option) => option.setName("2nd").setDescription("Number between 1 and 49").setRequired(true))
        .addIntegerOption((option) => option.setName("3rd").setDescription("Number between 1 and 49").setRequired(true))
        .addIntegerOption((option) => option.setName("4th").setDescription("Number between 1 and 49").setRequired(true))
        .addIntegerOption((option) => option.setName("5th").setDescription("Number between 1 and 49").setRequired(true))
        .addIntegerOption((option) => option.setName("6th").setDescription("Number between 1 and 49").setRequired(true)),

    async execute(interaction) {
        const userData = loadUserData();
        const userId = interaction.user.id;

        if (!userData[userId]) {
            userData[userId] = { money: 0 };
        }

        const userNumbers = [
            interaction.options.getInteger("1st"),
            interaction.options.getInteger("2nd"),
            interaction.options.getInteger("3rd"),
            interaction.options.getInteger("4th"),
            interaction.options.getInteger("5th"),
            interaction.options.getInteger("6th"),
        ];

        if (notUnique(userNumbers)) {
            await interaction.reply({ content: "Please ensure all numbers are unique.", ephemeral: true });
            return;
        }

        if (notInRange(userNumbers)) {
            await interaction.reply({ content: "Please ensure all numbers are between 1 and 49.", ephemeral: true });
            return;
        }

        const winningNumbers = generate();
        const correctGuesses = winningNumbers.filter((number) => userNumbers.includes(number)).length;

        const sortedWinningNumbers = winningNumbers.sort((a, b) => a - b);
        const formattedWinningNumbers = sortedWinningNumbers.map((number) =>
            userNumbers.includes(number) ? `**${number}**` : `${number}`
        );

        let prizeMoney = 0;
        switch (correctGuesses) {
            case 6:
                prizeMoney = 7000000;
                break;
            case 5:
                prizeMoney = 10000;
                break;
            case 4:
                prizeMoney = 100;
                break;
            case 3:
                prizeMoney = 10;
                break;
            case 2:
                prizeMoney = 1;
                break;
            case 1:
                prizeMoney = 0.01;
                break;
        }

        userData[userId].money += prizeMoney;

        saveUserData(userData);

        await interaction.reply(
            `${check(correctGuesses)}\nThe winning numbers were: ${formattedWinningNumbers.join(", ")}.`
        );
    },
};
