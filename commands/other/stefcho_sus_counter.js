const { SlashCommandBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "..", "data");
const COUNTER_FILE = path.join(dataDir, "stefcho_sus_counter.txt");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(COUNTER_FILE)) {
    fs.writeFileSync(COUNTER_FILE, "0", "utf8");
}

module.exports = {
    data: new SlashCommandBuilder().setName("stefcho_sus_counter").setDescription("Shows the Stefcho sus counter."),

    async execute(interaction) {
        try {
            const count = fs.readFileSync(COUNTER_FILE, "utf8").trim();
            await interaction.reply(`Stefcho sus counter: ${count}`);
        } catch (error) {
            console.error("Error reading Stefcho sus counter for command:", error);
            await interaction.reply({ content: "Could not retrieve the counter.", ephemeral: true });
        }
    },
};
