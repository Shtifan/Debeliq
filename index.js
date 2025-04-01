const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const { Player } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");
const { YoutubeiExtractor } = require("discord-player-youtubei");
const fs = require("fs").promises;
const { token, clientId } = require("./config.json");

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

async function loadCommandFiles(dir) {
    try {
        const files = await fs.readdir(dir);

        for (const file of files) {
            const filePath = `${dir}/${file}`;
            const stat = await fs.stat(filePath);

            if (stat.isDirectory()) {
                await loadCommandFiles(filePath);
            } else if (file.endsWith(".js")) {
                try {
                    const command = require(filePath);
                    if (!command.data || !command.execute) {
                        console.warn(`[WARNING] Command at ${filePath} is missing required properties`);
                        continue;
                    }
                    client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                } catch (error) {
                    console.error(`[ERROR] Failed to load command at ${filePath}:`, error);
                }
            }
        }
    } catch (error) {
        console.error(`[ERROR] Failed to read directory ${dir}:`, error);
    }
}

async function loadEventFiles(dir, player) {
    try {
        const files = await fs.readdir(dir);

        for (const file of files) {
            const filePath = `${dir}/${file}`;
            const stat = await fs.stat(filePath);

            if (stat.isDirectory()) {
                await loadEventFiles(filePath, player);
            } else if (file.endsWith(".js")) {
                try {
                    const event = require(filePath);
                    if (!event.name || !event.execute) {
                        console.warn(`[WARNING] Event at ${filePath} is missing required properties`);
                        continue;
                    }

                    if (event.type === "player") {
                        if (!player) {
                            console.warn(`[WARNING] Player events skipped - player not initialized`);
                            continue;
                        }
                        player.events.on(event.name, (...args) => event.execute(...args));
                    } else if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args));
                    }
                } catch (error) {
                    console.error(`[ERROR] Failed to load event at ${filePath}:`, error);
                }
            }
        }
    } catch (error) {
        console.error(`[ERROR] Failed to read directory ${dir}:`, error);
    }
}

async function initialize() {
    try {
        console.log("Starting bot initialization...");

        const player = new Player(client);
        player.extractors.loadMulti(DefaultExtractors);
        player.extractors.register(YoutubeiExtractor, {});

        await Promise.all([loadCommandFiles(`${__dirname}/commands`), loadEventFiles(`${__dirname}/events`, player)]);

        const rest = new REST().setToken(token);
        console.log("Started refreshing application (/) commands.");
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log(`Successfully reloaded ${commands.length} application (/) commands.`);

        await client.login(token);
    } catch (error) {
        console.error("Failed to initialize bot:", error);
        process.exit(1);
    }
}

initialize();
