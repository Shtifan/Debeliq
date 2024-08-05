const { Events } = require("discord.js");

module.exports = {
    name: Events.ClientReady,
    type: "client",
    once: true,
    execute(client) {
        console.log(`Ready on ${client.guilds.cache.size} servers!`);
    },
};
