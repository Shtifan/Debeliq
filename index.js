const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const config = require("./config.json");
const TOKEN = config.token;
const CLIENT_ID = config.client_id;

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
                if (event.once) {
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

client.once("ready", async () => {
    try {
        console.log(`[INFO] Started refreshing ${commandsToRegister.length} application (/) commands for all guilds.`);

        // Get all the guilds the bot is in
        const guilds = client.guilds.cache.map((guild) => guild.id);

        // Loop through each guild and register the commands
        for (const guildId of guilds) {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commandsToRegister });
        }

        console.log(`[INFO] Successfully reloaded application (/) commands for all ${guilds.length} guild(s).`);
    } catch (error) {
        console.error("[ERROR] Failed to refresh application commands:", error);
    }
});

client
    .login(TOKEN)
    .then(() => console.log("[INFO] Bot logged in successfully!"))
    .catch((error) => console.error("[ERROR] Bot login failed:", error));
