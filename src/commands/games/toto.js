const { SlashCommandBuilder } = require('discord.js');

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
    if (correctGuesses == 6) {
        return 'Congratulations! You win $7,000,000.';
    } else if (correctGuesses == 5) {
        return 'Congratulations! You win $7,000.';
    } else if (correctGuesses == 4) {
        return 'Congratulations! You win $70.';
    } else if (correctGuesses == 3) {
        return 'Congratulations! You win $7.';
    } else {
        return `Sorry, you didn't win anything.`;
    }
}

function notUnique(array) {
    return new Set(array).size !== array.length;
}

function notInRange(array) {
    return array.some(number => number < 1 || number > 49);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toto')
        .setDescription('Play toto 6/49')
        .addIntegerOption(option => option.setName('1st').setDescription('Numbers must be unique').setRequired(true))
        .addIntegerOption(option => option.setName('2nd').setDescription('Numbers must be unique').setRequired(true))
        .addIntegerOption(option => option.setName('3rd').setDescription('Numbers must be unique').setRequired(true))
        .addIntegerOption(option => option.setName('4th').setDescription('Numbers must be unique').setRequired(true))
        .addIntegerOption(option => option.setName('5th').setDescription('Numbers must be unique').setRequired(true))
        .addIntegerOption(option => option.setName('6th').setDescription('Numbers must be unique').setRequired(true)),

    async execute(interaction) {
        const userNumbers = [
            interaction.options.getInteger('1st'),
            interaction.options.getInteger('2nd'),
            interaction.options.getInteger('3rd'),
            interaction.options.getInteger('4th'),
            interaction.options.getInteger('5th'),
            interaction.options.getInteger('6th'),
        ];

        if (notUnique(userNumbers)) {
            return interaction.reply({
                content: 'Please ensure all numbers are unique',
                ephemeral: true,
            });
        }

        if (notInRange(userNumbers)) {
            return interaction.reply({
                content: 'Please ensure all numbers are between 1 and 49',
                ephemeral: true,
            });
        }

        const numbers = generate();
        const correctGuesses = numbers.filter(number => userNumbers.includes(number)).length;

        await interaction.reply(check(correctGuesses));
        const sortedNumbers = numbers.sort((a, b) => a - b);
        interaction.channel.send(`The numbers are: ${sortedNumbers.join(', ')}`);
    },
};
