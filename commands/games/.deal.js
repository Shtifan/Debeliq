const { SlashCommandBuilder } = require("discord.js");
const client = require("../../index.js");

let gamedeal = false;
let yourCase = 0;
let acceptingDeal = false;
const specialCases = [20, 15, 11, 8, 5];
let cases = [];

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i].value, arr[j].value] = [arr[j].value, arr[i].value];
    }
}

function removeCase(number, arr) {
    const index = arr.findIndex((c) => c.number === number);
    if (index !== -1) arr.splice(index, 1);
}

function displayRemainingValues(cases) {
    const sortedValues = cases
        .map((c) => `$${c.value.toLocaleString()}`)
        .sort((a, b) => a.replace(/[\$,]/g, "") - b.replace(/[\$,]/g, ""));
    return `Remaining values:\n${sortedValues.join("\n")}`;
}

function displayRemainingNumbers(cases) {
    const numbers = cases.map((c) => c.number).join(", ");
    return `Remaining case numbers: ${numbers}`;
}

function calculateOffer(cases) {
    const averageValue = cases.reduce((total, c) => total + c.value, 0) / cases.length;
    const offerPercentage = cases.length > 10 ? 0.2 : 0.1;
    const offer = averageValue * offerPercentage;
    return offer.toLocaleString();
}

function initializeGame() {
    cases = [
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
    shuffle(cases);
    yourCase = 0;
    acceptingDeal = false;
}

module.exports = {
    data: new SlashCommandBuilder().setName("deal").setDescription("Play Deal or No Deal"),

    async execute(interaction) {
        gamedeal = true;
        initializeGame();

        let reply = "The Deal or No Deal game has started.\n";
        reply += displayRemainingValues(cases);
        reply += "\nThe briefcases have been shuffled.\n";
        reply += "Choose your briefcase (1-26):";

        await interaction.reply(reply);
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot || !gamedeal) return;

    let reply = "";
    const userInput = message.content.toLowerCase();

    if (userInput === "yes" && acceptingDeal) {
        if (specialCases.includes(cases.length)) {
            reply = `Congratulations! You win **$${calculateOffer(cases)}**!\n`;
            gamedeal = false;
        } else if (cases.length === 2) {
            const finalValue = cases.find((c) => c.number === yourCase).value;
            reply = `Congratulations! You win **$${finalValue.toLocaleString()}**!\n`;
            gamedeal = false;
        }
    } else if (userInput === "no" && acceptingDeal) {
        if (specialCases.includes(cases.length)) {
            reply = "You declined the offer.\n";
            const remainingCases = specialCases.find((num) => num === cases.length) - specialCases.indexOf(cases.length);
            reply += `Now choose **${remainingCases}** more cases:\n`;
            acceptingDeal = false;
        } else if (cases.length === 2) {
            const finalValue = cases.find((c) => c.number === yourCase).value;
            reply = `Congratulations! You win **$${finalValue.toLocaleString()}**!\n`;
            gamedeal = false;
        }
    } else {
        if (acceptingDeal) return;

        const chosenCase = message.content;

        if (
            chosenCase == yourCase ||
            isNaN(chosenCase) ||
            chosenCase < 1 ||
            chosenCase > 26 ||
            !cases.some((c) => c.number === chosenCase)
        )
            return;

        if (yourCase === 0) {
            yourCase = chosenCase;
            reply += "Now choose **6** briefcases to reveal:\n";
        } else {
            const caseValue = cases.find((c) => c.number === chosenCase).value;
            reply += `Behind case **${chosenCase}** was **$${caseValue.toLocaleString()}**.\n`;
            removeCase(chosenCase, cases);
            reply += displayRemainingValues(cases) + "\n" + displayRemainingNumbers(cases) + "\n";

            if (specialCases.includes(cases.length)) {
                reply += `The banker's offer is **$${calculateOffer(cases)}**.\nDo you accept the deal?\n`;
                acceptingDeal = true;
            } else if (cases.length === 2) {
                reply += "Do you want to switch your case with the last remaining one?\n";
                acceptingDeal = true;
            }
        }
    }

    await message.channel.send(reply);
});
