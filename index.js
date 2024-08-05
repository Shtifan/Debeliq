const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const { Player } = require("discord-player");
const fs = require("fs");
const path = require("path");
const { clientId, token } = require("./config.json");

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
const commandsPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(commandsPath);

const commands = [];

for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(path.join(commandsPath, folder)).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, folder, file);
        const command = require(filePath);

        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const rest = new REST().setToken(token);

(async () => {
    try {
        const data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log(`Successfully registered ${data.length} slash commands.`);
    } catch (error) {
        console.error(error);
    }
})();

const player = new Player(client);
player.extractors.loadDefault();

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

let eventCount = 0;

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.type == "player") {
        player.events.on(event.name, (...args) => event.execute(...args));
        eventCount++;
    } else if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
        eventCount++;
    } else {
        client.on(event.name, (...args) => event.execute(...args));
        eventCount++;
    }
}

console.log(`Successfully loaded ${eventCount} events.`);

client.login(token);
