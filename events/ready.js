const { Events } = require("discord.js");

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(
            `Ready! Logged in as ${client.user.tag} on ${client.guilds.cache.size} server${
                client.guilds.cache.size != 1 ? "s" : ""
            }!`
        );
    },
};
