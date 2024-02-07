const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { token } = require("./config.json");
const { Player } = require("discord-player");

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

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

require("./register.js");

client.buttons = new Collection();
const buttonsPath = path.join(__dirname, "buttons");
const buttonFolders = fs.readdirSync(buttonsPath);

for (const folder of buttonFolders) {
    const buttonFiles = fs.readdirSync(path.join(buttonsPath, folder)).filter((file) => file.endsWith(".js"));

    for (const file of buttonFiles) {
        const filePath = path.join(buttonsPath, folder, file);
        const button = require(filePath);

        if ("data" in button && "execute" in button) {
            client.buttons.set(button.data.name, button);
        }
    }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const player = new Player(client);
player.extractors.loadDefault();

require("./player.js");

client.login(token);
