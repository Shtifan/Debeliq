const { SlashCommandBuilder } = require("discord.js");

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
    if (correctGuesses == 6) return "Congratulations! You win **$7,000,000**!";
    if (correctGuesses == 5) return "Congratulations! You win **$10,000**!";
    if (correctGuesses == 4) return "Congratulations! You win **$100**!";
    if (correctGuesses == 3) return "Congratulations! You win **$10**!";
    if (correctGuesses == 2) return "Congratulations! You win **$1**!";
    if (correctGuesses == 1) return "Congratulations! You win **$0.01**!";
    return `Sorry, you didn't win anything.`;
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
        .setDescription("Play Toto 6/49!")
        .addIntegerOption((option) =>
            option.setName("1st").setDescription("Numbers must be unique and in the range of 1 to 49").setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName("2nd").setDescription("Numbers must be unique and in the range of 1 to 49").setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName("3rd").setDescription("Numbers must be unique and in the range of 1 to 49").setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName("4th").setDescription("Numbers must be unique and in the range of 1 to 49").setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName("5th").setDescription("Numbers must be unique and in the range of 1 to 49").setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName("6th").setDescription("Numbers must be unique and in the range of 1 to 49").setRequired(true)
        ),

    async execute(interaction) {
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
            userNumbers.includes(number) ? `**${number}**` : number
        );

        let reply = "";
        reply += check(correctGuesses);
        reply += `\nThe winning numbers were: ${formattedWinningNumbers.join(", ")}.`;

        await interaction.reply(reply);
    },
};
