const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const { Player } = require("discord-player");
const { YoutubeiExtractor } = require("discord-player-youtubei");
const fs = require("fs");
const path = require("path");
const { token, clientId, YT_CREDENTIAL } = require("./config.json");

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
const commands = [];

const commandsPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(path.join(commandsPath, folder)).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, folder, file);
        const command = require(filePath);

        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

const rest = new REST().setToken(token);
rest.put(Routes.applicationCommands(clientId), { body: commands });

const player = new Player(client);

player.extractors.register(YoutubeiExtractor, {
    authentication: YT_CREDENTIAL,
    streamOptions: {
        useClient: "ANDROID",
    },
});

player.extractors.loadDefault((ext) => !["YouTubeExtractor"].includes(ext));

const eventsPath = path.join(__dirname, "events");
const eventFolders = fs.readdirSync(eventsPath);

for (const folder of eventFolders) {
    const eventFiles = fs.readdirSync(path.join(eventsPath, folder)).filter((file) => file.endsWith(".js"));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, folder, file);
        const event = require(filePath);

        if (event.type == "player") {
            player.events.on(event.name, (...args) => event.execute(...args));
        } else if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

client.login(token);
