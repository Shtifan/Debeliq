const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const { Player } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");
const { YoutubeiExtractor } = require("discord-player-youtubei");
const fs = require("node:fs");
const path = require("node:path");

require("dotenv").config();
const { TOKEN, CLIENT_ID } = process.env;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();
client.activeGames = new Collection();

const commandsToRegister = [];
const commandsPath = path.join(__dirname, "commands");

function loadCommands(directory) {
    const commandFiles = fs.readdirSync(directory, { withFileTypes: true });
    for (const file of commandFiles) {
        const filePath = path.join(directory, file.name);
        if (file.isDirectory()) {
            loadCommands(filePath);
        } else if (file.name.endsWith(".js")) {
            try {
                const command = require(filePath);
                if ("data" in command && "execute" in command) {
                    client.commands.set(command.data.name, command);
                    commandsToRegister.push(command.data.toJSON());
                    console.log(`[INFO] Loaded command: ${command.data.name} from ${file.name}`);
                } else {
                    console.warn(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
                }
            } catch (error) {
                console.error(`[ERROR] Could not load command at ${filePath}:`, error);
            }
        }
    }
}
loadCommands(commandsPath);
console.log(`[INFO] Successfully loaded ${client.commands.size} command(s).`);

const player = new Player(client);
player.extractors.loadMulti(DefaultExtractors);
player.extractors.register(YoutubeiExtractor, {});
console.log("[INFO] Player initialized.");

const eventsPath = path.join(__dirname, "events");

function loadEvents(directory) {
    const eventFiles = fs.readdirSync(directory, { withFileTypes: true });
    for (const file of eventFiles) {
        const filePath = path.join(directory, file.name);
        if (file.isDirectory()) {
            loadEvents(filePath);
        } else if (file.name.endsWith(".js")) {
            try {
                const event = require(filePath);
                if (event.type === "player") {
                    player.events.on(event.name, (...args) => event.execute(...args));
                } else if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
                console.log(`[INFO] Loaded event: ${event.name} from ${file.name}`);
            } catch (error) {
                console.error(`[ERROR] Could not load event at ${filePath}:`, error);
            }
        }
    }
}
loadEvents(eventsPath);
console.log(`[INFO] Successfully loaded event handlers.`);

const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
    try {
        console.log(`[INFO] Started refreshing ${commandsToRegister.length} application (/) commands.`);
        const data = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandsToRegister });
        console.log(`[INFO] Successfully reloaded ${data.length} application (/) commands globally.`);
    } catch (error) {
        console.error("[ERROR] Failed to refresh application commands:", error);
    }
})();

client
    .login(TOKEN)
    .then(() => console.log("[INFO] Bot logged in successfully!"))
    .catch((error) => console.error("[ERROR] Bot login failed:", error));
