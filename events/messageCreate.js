const { Events } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

let cowsAndBullsUtils;
try {
    const cowsBullsCommand = require("../commands/games/cows_bulls.js");
    if (cowsBullsCommand && cowsBullsCommand.utils) {
        cowsAndBullsUtils = cowsBullsCommand.utils;
    } else {
        console.error("[ERROR] Could not load cows_bulls.js utils. Game logic might fail.");
    }
} catch (e) {
    console.error("[ERROR] Failed to require cows_bulls.js for utils:", e);
}

const STEFCHO_ID = "568496102127566873";
const dataDir = path.join(__dirname, "..", "data");
const COUNTER_FILE_STEFCHO = path.join(dataDir, "stefcho_sus_counter.txt");
const SUS_FILE_STEFCHO = path.join(dataDir, "sus.txt");

function ensureStefchoFiles() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(COUNTER_FILE_STEFCHO)) {
        fs.writeFileSync(COUNTER_FILE_STEFCHO, "0", "utf8");
    }
    if (!fs.existsSync(SUS_FILE_STEFCHO)) {
        const defaultSusWords = "sus\namogus\nimpostor";
        fs.writeFileSync(SUS_FILE_STEFCHO, defaultSusWords, "utf8");
        console.log(`Created ${SUS_FILE_STEFCHO} with default words.`);
    }
}
ensureStefchoFiles();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        if (client.activeGames && client.activeGames.has(message.channelId) && cowsAndBullsUtils) {
            const gameData = client.activeGames.get(message.channelId);

            if (gameData.gameType === "cows_bulls" && gameData.userId === message.author.id) {
                const input = message.content.trim();

                if (!/^\d{4}$/.test(input) || cowsAndBullsUtils.hasDuplicates(input.split(""))) {
                    return;
                }

                gameData.guesses++;
                const [bulls, cows] = cowsAndBullsUtils.calculateCowsAndBulls(gameData.secretNumber, input);

                let replyContent = `**${bulls}** bull${bulls !== 1 ? "s" : ""} and **${cows}** cow${cows !== 1 ? "s" : ""}.`;

                if (bulls === 4) {
                    replyContent += `\n Congratulations, ${message.author.username}! You guessed the number **${
                        gameData.secretNumber
                    }** in **${gameData.guesses}${cowsAndBullsUtils.ending(gameData.guesses)}** attempt!`;

                    let prize = 0;
                    if (gameData.guesses <= 5) prize = 100000;
                    else if (gameData.guesses <= 7) prize = 50000;
                    else if (gameData.guesses <= 10) prize = 10000;

                    if (prize > 0) {
                        const formattedPrize = prize.toLocaleString("en-US");
                        replyContent += `\nYou won **${formattedPrize}** coins!`;

                        const userData = cowsAndBullsUtils.loadUserData();
                        const userId = message.author.id;
                        userData[userId] = userData[userId] || { money: 0 };
                        userData[userId].money += prize;
                        cowsAndBullsUtils.saveUserData(userData);
                    } else {
                        replyContent += `\nGood job, but no prize for this many guesses. Better luck next time!`;
                    }

                    client.activeGames.delete(message.channelId);
                }
                await message.reply(replyContent).catch((err) => console.error("Error replying in Cows & Bulls:", err));
                return;
            }
        }

        if (message.author.id === STEFCHO_ID) {
            try {
                const susWordsData = fs.readFileSync(SUS_FILE_STEFCHO, "utf8");
                const words = susWordsData
                    .trim()
                    .split("\n")
                    .map((word) => word.toLowerCase().trim())
                    .filter((word) => word.length > 0);
                const messageContent = message.content.toLowerCase();

                const foundWord = words.some((word) => messageContent.includes(word));

                if (foundWord) {
                    let counter = 0;
                    try {
                        counter = parseInt(fs.readFileSync(COUNTER_FILE_STEFCHO, "utf8").trim(), 10) || 0;
                    } catch (readErr) {
                        console.error("Error reading stefcho_sus_counter.txt, defaulting to 0:", readErr);
                    }

                    counter++;

                    fs.writeFile(COUNTER_FILE_STEFCHO, counter.toString(), (writeErr) => {
                        if (writeErr) {
                            console.error("Error writing to stefcho_sus_counter.txt:", writeErr);
                            return;
                        }
                        console.log(`Stefcho sus counter incremented to: ${counter} by message: "${message.content}"`);
                    });
                }
            } catch (error) {
                console.error("Error processing Stefcho sus check:", error);
            }
        }

        if (message.content.toLowerCase() === "koj") {
            try {
                await message.reply("te e pital");
            } catch (error) {
                console.error("Error replying to 'koj' message:", error);
            }
        }
    },
};
