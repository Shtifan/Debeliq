const { Events } = require("discord.js");

module.exports = {
    name: Events.Error,
    type: "error",
    once: false,
    execute(err) {
        console.error(err);
    },
};
