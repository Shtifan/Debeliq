const { Events } = require("discord.js");

module.exports = {
    name: Events.Warn,
    type: "warn",
    once: false,
    execute(message) {
        console.warn(message);
    },
};
