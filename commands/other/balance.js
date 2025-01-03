const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const userDataPath = path.join(__dirname, "../../data/user_data.json");

function loadUserData() {
    if (!fs.existsSync(userDataPath)) {
        fs.writeFileSync(userDataPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(userDataPath, "utf8"));
}

function saveUserData(data) {
    fs.writeFileSync(userDataPath, JSON.stringify(data, null, 4));
}

module.exports = {
    data: new SlashCommandBuilder().setName("balance").setDescription("Check your current balance"),

    async execute(interaction) {
        const userData = loadUserData();
        const userId = interaction.user.id;

        if (!userData[userId]) {
            userData[userId] = { money: 0 };
            saveUserData(userData);
        }

        const balance = userData[userId].money;

        await interaction.reply(
            `Your current balance is: **${balance.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
            })}**.`
        );
    },
};
