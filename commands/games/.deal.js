const { SlashCommandBuilder } = require("discord.js");
const client = require("../../index.js");

// Utility function to shuffle the cases array
function shuffleCases(cases) {
    for (let i = cases.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cases[i].value, cases[j].value] = [cases[j].value, cases[i].value];
    }
}

// Removes a case by number from the cases array
function removeCase(caseNumber, cases) {
    const index = cases.findIndex((c) => c.number === caseNumber);
    cases.splice(index, 1);
}

// Returns a string of remaining case values, formatted
function displayRemainingValues(cases) {
    const sortedValues = cases
        .map((c) => c.value)
        .sort((a, b) => a - b)
        .map((value) => `$${value.toLocaleString()}`);
    return `Remaining values:\n${sortedValues.join("\n")}`;
}

// Returns a string of remaining case numbers
function displayRemainingCaseNumbers(cases) {
    const caseNumbers = cases.map((c) => c.number).join(", ");
    return `Remaining case numbers: ${caseNumbers}`;
}

// Calculates the banker's offer based on the remaining cases
function calculateBankerOffer(cases) {
    const totalValue = cases.reduce((sum, c) => sum + c.value, 0);
    const averageValue = totalValue / cases.length;

    // Offer percentage decreases as fewer cases remain
    const offerPercentage = cases.length > 10 ? 0.2 : 0.1;
    const offer = averageValue * offerPercentage;

    return offer.toLocaleString();
}

// Game state variables
let isGameActive = false;
let cases = [];
let yourCase = 0;
let isAwaitingDeal = false;

module.exports = {
    data: new SlashCommandBuilder().setName("deal").setDescription("Play Deal or No Deal!"),

    async execute(interaction) {
        isGameActive = true;

        // Initialize the cases
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

        // Shuffle the cases
        shuffleCases(cases);

        yourCase = 0;
        isAwaitingDeal = false;

        // Send game initialization message
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

// Message handler for gameplay interactions
client.on("messageCreate", async (message) => {
    if (message.author.bot || !isGameActive) return;

    const specialRounds = [20, 15, 11, 8, 5];
    let reply = "";

    if (message.content.toLowerCase() === "yes" && isAwaitingDeal) {
        if (specialRounds.includes(cases.length)) {
            reply += `Congratulations! You win **$${calculateBankerOffer(cases)}**!\n`;
            isGameActive = false;
        } else if (cases.length === 2) {
            const finalCaseIndex = cases.findIndex((c) => c.number === cases[0].number);
            reply += `Congratulations! You win **$${cases[finalCaseIndex].value.toLocaleString()}**!\n`;
            isGameActive = false;
        }
    } else if (message.content.toLowerCase() === "no" && isAwaitingDeal) {
        if (specialRounds.includes(cases.length)) {
            reply += "You declined the banker's offer.\n";
            const remainingCasesToPick =
                specialRounds.find((s) => s === cases.length) - specialRounds[specialRounds.indexOf(cases.length) + 1];
            reply += `Now, choose **${remainingCasesToPick}** more cases:\n`;
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
            // Set player's case
            yourCase = chosenNumber;
            reply += "Now choose **6** briefcases to reveal:\n";
        } else {
            reply += `Behind case **${chosenNumber}** there were **$${cases[chosenCaseIndex].value.toLocaleString()}**.\n`;
            removeCase(chosenNumber, cases);
            reply += `${displayRemainingValues(cases)}\n`;
            reply += `${displayRemainingCaseNumbers(cases)}\n`;

            if (specialRounds.includes(cases.length)) {
                reply += `The banker offers you **$${calculateBankerOffer(cases)}**.\n`;
                reply += "Do you accept the deal? (yes/no)\n";
                isAwaitingDeal = true;
            } else if (cases.length === 2) {
                reply += "Do you want to switch your case with the last remaining one? (yes/no)\n";
                isAwaitingDeal = true;
            }
        }
    }

    await message.channel.send(reply);
});
