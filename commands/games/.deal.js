const { SlashCommandBuilder } = require("discord.js");
const client = require("../../index.js");

function shuffleCases(cases) {
    for (let i = cases.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cases[i].value, cases[j].value] = [cases[j].value, cases[i].value];
    }
}

function removeCase(caseNumber, cases) {
    const index = cases.findIndex((c) => c.number === caseNumber);
    if (index !== -1) cases.splice(index, 1);
}

function displayRemainingValues(cases) {
    const sortedValues = cases
        .map((c) => c.value)
        .sort((a, b) => a - b)
        .map((value) => `$${value.toLocaleString()}`);
    return `Remaining values:\n${sortedValues.join("\n")}`;
}

function displayRemainingCaseNumbers(cases, yourCase) {
    const caseNumbers = cases.map((c) => (c.number === yourCase ? `**${c.number}**` : c.number)).join(", ");
    return `Remaining case numbers: ${caseNumbers}`;
}

function calculateBankerOffer(cases) {
    const totalValue = cases.reduce((sum, c) => sum + c.value, 0);
    const expectedValue = totalValue / cases.length;

    const roundNumber = 10 - Math.floor((cases.length - 1) / 3);

    const offer = Math.floor(expectedValue * (roundNumber / 9));

    return offer.toLocaleString();
}

function calculateRemainingCasesToPick(cases) {
    const specialRounds = [20, 15, 11, 8, 6, 5, 4, 3];
    if (cases.length > 2) {
        const index = specialRounds.indexOf(cases.length);
        if (index !== -1 && index + 1 < specialRounds.length) {
            return specialRounds[index] - specialRounds[index + 1];
        }
    }
    return 1;
}

let isGameActive = false;
let cases = [];
let yourCase = 0;
let isAwaitingDeal = false;
let remainingCasesToPick = 6;

module.exports = {
    data: new SlashCommandBuilder().setName("deal").setDescription("Play Deal or No Deal!"),

    async execute(interaction) {
        isGameActive = true;
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

        shuffleCases(cases);
        yourCase = 0;
        isAwaitingDeal = false;
        remainingCasesToPick = 6;

        let reply = "The Deal or No Deal game has started!\n";
        reply += `These are the values inside the briefcases:\n${displayRemainingValues(cases)
            .split("\n")
            .slice(1)
            .join("\n")}`;
        reply += "\nThe briefcases have been shuffled.\n";
        reply += "Please choose your briefcase (1-26):";

        await interaction.reply(reply);
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot || !isGameActive) return;

    const specialRounds = [20, 15, 11, 8, 6, 5, 4, 3];
    let reply = "";

    if (message.content.toLowerCase() === "yes" && isAwaitingDeal) {
        if (specialRounds.includes(cases.length)) {
            reply += `Congratulations! You win **$${calculateBankerOffer(cases)}**!\n`;

            const finalCaseIndex = cases.findIndex((c) => c.number === yourCase);
            reply += `Behind your case **${yourCase}** there were **$${cases[finalCaseIndex].value.toLocaleString()}**!\n`;

            isGameActive = false;
        } else if (cases.length === 2) {
            const finalCaseIndex = cases.findIndex((c) => c.number === cases[0].number);
            reply += `Congratulations! You win **$${cases[finalCaseIndex].value.toLocaleString()}**!\n`;

            isGameActive = false;
        }
    } else if (message.content.toLowerCase() === "no" && isAwaitingDeal) {
        if (specialRounds.includes(cases.length)) {
            reply += "You declined the banker's offer.\n";
            remainingCasesToPick = calculateRemainingCasesToPick(cases);
            reply += `Open **${remainingCasesToPick}** more case(s):\n`;

            isAwaitingDeal = false;
        } else if (cases.length === 2) {
            const finalCaseIndex = cases.findIndex((c) => c.number === yourCase);
            reply += `Congratulations! You win **$${cases[finalCaseIndex].value.toLocaleString()}**!\n`;

            isGameActive = false;
        }
    } else {
        if (isAwaitingDeal) return;

        const chosenNumber = parseInt(message.content);
        if (
            isNaN(chosenNumber) ||
            chosenNumber < 1 ||
            chosenNumber > 26 ||
            cases.findIndex((c) => c.number === chosenNumber) === -1 ||
            chosenNumber === yourCase
        )
            return;

        const chosenCaseIndex = cases.findIndex((c) => c.number === chosenNumber);

        if (yourCase === 0) {
            yourCase = chosenNumber;
            reply += "Now open **6** briefcases to reveal:\n";
        } else {
            reply += `Behind case **${chosenNumber}** there were **$${cases[chosenCaseIndex].value.toLocaleString()}**.\n`;
            removeCase(chosenNumber, cases);

            reply += `${displayRemainingValues(cases)}\n`;
            reply += `${displayRemainingCaseNumbers(cases, yourCase)}\n`;

            remainingCasesToPick -= 1;
            if (remainingCasesToPick != 0) reply += `Open **${remainingCasesToPick}** more case(s):\n`;

            if (remainingCasesToPick <= 0) {
                if (specialRounds.includes(cases.length)) {
                    reply += `The banker offers you **$${calculateBankerOffer(cases)}**.\n`;
                    reply += "Do you accept the deal? (**yes**/**no**)\n";
                    isAwaitingDeal = true;
                } else if (cases.length === 2) {
                    reply += "Do you want to switch your case with the last remaining one? (**yes**/**no**)\n";
                    isAwaitingDeal = true;
                } else {
                    remainingCasesToPick = calculateRemainingCasesToPick(cases);
                    reply += `Open **${remainingCasesToPick}** more case(s) till the banker's offer:\n`;
                }
            }
        }
    }

    await message.channel.send(reply);
});
