const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const client = require("../../index.js");

const STEFCHO_ID = "568496102127566873";
const COUNTER_FILE = "./data/stefcho_sus_counter.txt";
const SUS_FILE = "./data/sus.txt";

if (!fs.existsSync(COUNTER_FILE)) {
    fs.writeFileSync(COUNTER_FILE, "0", "utf8");
}

if (!fs.existsSync(SUS_FILE)) {
    fs.writeFileSync(SUS_FILE, "", "utf8");
}

module.exports = {
    data: new SlashCommandBuilder().setName("stefcho_sus_counter").setDescription("Shows the Stefcho sus counter"),

    async execute(interaction) {
        const count = fs.readFileSync(COUNTER_FILE, "utf8").trim();
        await interaction.reply("Stefcho sus counter: " + count);
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.author.id !== STEFCHO_ID) return;

    fs.readFile(SUS_FILE, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading sus.txt:", err);
            return;
        }

        const words = data
            .trim()
            .split("\n")
            .map((word) => word.toLowerCase().trim());
        const messageContent = message.content.toLowerCase();

        const foundWord = words.some((word) => word && messageContent.includes(word));
        if (foundWord) {
            fs.readFile(COUNTER_FILE, "utf8", (err, counterData) => {
                if (err) {
                    console.error("Error reading stefcho_sus_counter.txt:", err);
                    return;
                }

                let counter = parseInt(counterData.trim(), 10) || 0;
                counter++;

                fs.writeFile(COUNTER_FILE, counter.toString(), (err) => {
                    if (err) {
                        console.error("Error writing to stefcho_sus_counter.txt:", err);
                        return;
                    }

                    message.reply("Stefcho sus counter: " + counter);
                });
            });
        }
    });
});
