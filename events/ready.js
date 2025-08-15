const { Events } = require("discord.js");

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        // This is the first message that will appear in your console upon a successful login.
        console.log(`Logged in as ${client.user.tag}`);
    },
};
