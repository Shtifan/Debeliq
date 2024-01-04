const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { Player } = require("discord-player");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});
module.exports = client;

const player = new Player(client);
player.extractors.loadDefault();

client.commands = new Collection();
const commands = [];

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

client.once("ready", (client) => {
    client.application.commands.set(commands);
    console.log(`Ready on ${client.guilds.cache.size} server${client.guilds.cache.size != 1 ? "s" : ""}!`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
        } else {
            await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }
});

require("./events.js");

client.login(process.env.DISCORD_TOKEN);
