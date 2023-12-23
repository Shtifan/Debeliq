const { SlashCommandBuilder } = require('discord.js');
const client = require('../../main.js');

let cases = [
    { number: 1, value: 0.01 },
    { number: 2, value: 1 },
    { number: 3, value: 5 },
    { number: 4, value: 10 },
    { number: 5, value: 25 },
    { number: 6, value: 50 },
    { number: 7, value: 75 },
    { number: 8, value: 100 },
    { number: 9, value: 200 },
    { number: 10, value: 300 },
    { number: 11, value: 400 },
    { number: 12, value: 500 },
    { number: 13, value: 750 },
    { number: 14, value: 1000 },
    { number: 15, value: 5000 },
    { number: 16, value: 10000 },
    { number: 17, value: 25000 },
    { number: 18, value: 50000 },
    { number: 19, value: 75000 },
    { number: 20, value: 100000 },
    { number: 21, value: 200000 },
    { number: 22, value: 300000 },
    { number: 23, value: 400000 },
    { number: 24, value: 500000 },
    { number: 25, value: 750000 },
    { number: 26, value: 1000000 },
];

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i].value, arr[j].value] = [arr[j].value, arr[i].value];
    }
}

function remove(number, arr) {
    const index = arr.findIndex(c => c.number == number);
    arr.splice(index, 1);
}

function getOffer(cases) {
    const totalValue = cases.reduce((sum, c) => sum + c.value, 0);
    const averageValue = totalValue / cases.length;

    const offerPercentage = 0.8;

    const bankerOffer = averageValue * offerPercentage;

    return Math.floor((bankerOffer * 100) / 100);
}

function remainingCases(cases) {
    let remainingValues = cases.map(c => c.value);
    let sortedValues = remainingValues
        .sort((a, b) => a - b)
        .map(c => `$${c}`)
        .join('\n');

    return `Remaining values:\n${sortedValues}`;
}

function remainingNumbers(cases) {
    let numbers = '';

    cases.forEach(c => {
        numbers += `${c.number}, `;
    });

    numbers = numbers.slice(0, -2);

    return `Remaining numbers: ${numbers}`;
}

let gamedeal = false;
let yourCase = 0;

module.exports = {
    data: new SlashCommandBuilder().setName('deal').setDescription('Play deal or no deal'),

    async execute(interaction) {
        gamedeal = true;
        await interaction.reply('The deal or no deal game has started.');
        await interaction.channel.send('These are all the briefcases:');
        let remaining = remainingCases(cases);
        await interaction.channel.send(remaining);
        shuffle(cases);
        await interaction.channel.send('The briefcases have been shuffled.');
        await interaction.channel.send('Choose your briefcase:');
    },
};

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!gamedeal) return;

    let special = [20, 15, 11, 8, 5];
    if (message.content.toLowerCase() == 'yes' && (special.includes(cases.length) || cases.length == 2)) {
        if (cases.length == 2) {
            let index = cases.findIndex(c => c.number == cases[0].number);
            message.channel.send(`Congratulations! You win $${cases[index].value}`);
            gamedeal = false;
        } else {
            message.channel.send(`Congratulations! You win $${getOffer(cases)}`);
            gamedeal = false;
        }
    } else if (message.content.toLowerCase() == 'no' && (special.includes(cases.length) || cases.length == 2)) {
        if (cases.length == 2) {
            let index = cases.findIndex(c => c.number == yourCase);
            message.channel.send(`Congratulations! You win $${cases[index].value}`);
            gamedeal = false;
        } else {
            message.channel.send(`You declined the dealer's offer`);
            let remainingCases = cases.length - special[special.indexOf(cases.length) + 1];
            message.channel.send(`Now choose ${remainingCases} more cases:`);
        }
    } else {
        let input = parseInt(message.content);
        if (isNaN(message.content) || input < 1 || input > 26) return;

        let index = 0;
        if (cases.findIndex(c => c.number == input) == -1) return;
        else index = cases.findIndex(c => c.number == input);

        if (input == yourCase) return;

        if (yourCase == 0) {
            yourCase = input;
            message.channel.send('Now choose 6 briefcases to reveal:');
        } else {
            message.channel.send(`Behind case ${input} there were $${cases[index].value}`);
            remove(input, cases);

            if (special.includes(cases.length)) {
                message.channel.send(`The banker offer is $${getOffer(cases)}`);
                message.channel.send('Do you accept the deal?');
            }

            if (cases.length == 2) message.channel.send('Do you want to switch your case with the last remaining?');

            if (!(special.includes(cases.length) || cases.length == 2)) {
                let remaining = remainingCases(cases);
                message.channel.send(remaining);
                let numbers = remainingNumbers(cases);
                message.channel.send(numbers);
            }
        }
    }
});
