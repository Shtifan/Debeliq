const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const userDataPath = path.join(dataDir, "user_data.json");

async function ensureDataDir() {
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch {}
}

async function loadUserData() {
    try {
        await ensureDataDir();
        try {
            await fs.access(userDataPath);
        } catch {
            await fs.writeFile(userDataPath, JSON.stringify({}), "utf8");
        }
        const data = await fs.readFile(userDataPath, "utf8");
        return JSON.parse(data || "{}");
    } catch (error) {
        console.error("Error loading user data:", error);
        return {};
    }
}

async function saveUserData(data) {
    try {
        await ensureDataDir();
        await fs.writeFile(userDataPath, JSON.stringify(data, null, 4), "utf8");
    } catch (error) {
        console.error("Error saving user data:", error);
        throw new Error("Failed to save user data");
    }
}

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

function generateSecretNumber() {
    let digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
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

function calculateCowsAndBulls(secret, guess) {
    let bulls = 0;
    let cows = 0;
    const secretStr = String(secret);
    const guessStr = String(guess);

    for (let i = 0; i < secretStr.length; i++) {
        if (secretStr[i] === guessStr[i]) {
            bulls++;
        } else if (secretStr.includes(guessStr[i])) {
            cows++;
        }
    }
    return { bulls, cows };
}

function generateAllPossibilities() {
    const possibilities = [];
    for (let i = 1000; i <= 9999; i++) {
        const s = i.toString();
        if (!hasDuplicates(s.split(""))) {
            possibilities.push(s);
        }
    }

    for (let i = 100; i <= 999; i++) {
        const s = "0" + i.toString();
        if (!hasDuplicates(s.split(""))) {
            possibilities.push(s);
        }
    }
    return possibilities;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cows_bulls")
        .setDescription("Play a game of Cows and Bulls!")
        .addStringOption((option) =>
            option
                .setName("mode")
                .setDescription("Who will be the one guessing the number?")
                .setRequired(true)
                .addChoices(
                    { name: "You guess the number", value: "guessing" },
                    { name: "I guess your number", value: "ai" }
                )
        ),

    async execute(interaction, client) {
        if (client.activeGames.has(interaction.channelId)) {
            return interaction.reply({
                content: "A game is already active in this channel!",
                ephemeral: true,
            });
        }

        const mode = interaction.options.getString("mode");

        if (mode === "guessing") {
            await handleGuessingMode(interaction, client);
        } else if (mode === "ai") {
            await handleAiMode(interaction, client);
        }
    },
};

async function handleGuessingMode(interaction, client) {
    const secretNumber = generateSecretNumber();
    const gameData = {
        gameType: "cows_bulls",
        mode: "guessing",
        userId: interaction.user.id,
        secretNumber: secretNumber,
        guesses: 0,
    };

    client.activeGames.set(interaction.channelId, gameData);

    await interaction.reply(
        `I've generated a 4-digit number (all unique digits, not starting with zero).\n` +
            `You're playing, ${interaction.user.username}! Type your 4-digit guesses in this channel.`
    );

    const collector = interaction.channel.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id,
        time: 300000,
    });

    collector.on("collect", async (message) => {
        const input = message.content.trim();

        if (!/^\d{4}$/.test(input) || hasDuplicates(input.split(""))) {
            return;
        }

        gameData.guesses++;
        const { bulls, cows } = calculateCowsAndBulls(gameData.secretNumber, input);

        if (bulls === 4) {
            let replyContent = `Congratulations, ${message.author.username}! You guessed the number **${
                gameData.secretNumber
            }** in **${gameData.guesses}${ending(gameData.guesses)}** attempt!`;

            let prize = 0;
            if (gameData.guesses <= 5) prize = 100000;
            else if (gameData.guesses <= 7) prize = 50000;
            else if (gameData.guesses <= 10) prize = 10000;

            if (prize > 0) {
                replyContent += `\nYou won **${prize}** coins!`;

                const userData = await loadUserData();
                userData[interaction.user.id] = userData[interaction.user.id] || { money: 0 };
                userData[interaction.user.id].money += prize;
                await saveUserData(userData);
            } else {
                replyContent += `\nGood job, but no prize for this many guesses. Better luck next time!`;
            }
            await message.reply(replyContent);
            collector.stop();
        } else {
            await message.reply(
                `Your guess \`${input}\` has **${bulls}** bull${bulls !== 1 ? "s" : ""} and **${cows}** cow${
                    cows !== 1 ? "s" : ""
                }.`
            );
        }
    });

    collector.on("end", (collected, reason) => {
        client.activeGames.delete(interaction.channelId);
        if (reason === "time") {
            interaction.followUp("The game has ended due to inactivity.");
        }
    });
}

async function handleAiMode(interaction, client) {
    const gameData = {
        gameType: "cows_bulls",
        mode: "ai",
        userId: interaction.user.id,
        possibilities: generateAllPossibilities(),
        guesses: 0,
        currentGuess: "1234",
    };

    client.activeGames.set(interaction.channelId, gameData);

    await interaction.reply(
        `Alright, ${interaction.user.username}, think of a 4-digit number with unique digits.\n` +
            `I will try to guess it. For each guess I make, please reply with the number of bulls and cows.\n` +
            `Use the format \`B<bulls> C<cows>\` (e.g., \`B1 C2\`).\n\n` +
            `My first guess is: **${gameData.currentGuess}**`
    );

    const collector = interaction.channel.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id,
        time: 300000,
    });

    collector.on("collect", async (message) => {
        const feedbackRegex = /^B([0-4]) C([0-4])$/i;
        const match = message.content.trim().match(feedbackRegex);

        if (!match) {
            await message.reply("Invalid format. Please use the format `B<bulls> C<cows>` (e.g., `B1 C2`).");
            return;
        }

        const bulls = parseInt(match[1], 10);
        const cows = parseInt(match[2], 10);

        if (bulls + cows > 4) {
            await message.reply("Invalid feedback. The sum of bulls and cows cannot be greater than 4.");
            return;
        }

        if (bulls === 4) {
            await message.reply(
                `I win! Your number was **${gameData.currentGuess}**. It took me ${gameData.guesses + 1} guesses.`
            );
            collector.stop();
            return;
        }

        gameData.possibilities = gameData.possibilities.filter((p) => {
            if (p === gameData.currentGuess) return false;
            const feedback = calculateCowsAndBulls(p, gameData.currentGuess);
            return feedback.bulls === bulls && feedback.cows === cows;
        });

        if (gameData.possibilities.length === 0) {
            await message.reply(
                "It seems there was an inconsistency in your feedback. I have no more possible numbers. Game over."
            );
            collector.stop();
            return;
        }

        gameData.guesses++;
        gameData.currentGuess = gameData.possibilities[0];

        await message.reply(`Okay, my next guess is: **${gameData.currentGuess}**`);
    });

    collector.on("end", (collected, reason) => {
        client.activeGames.delete(interaction.channelId);
        if (reason === "time") {
            interaction.followUp("The game has ended due to inactivity.");
        }
    });
}
