module.exports = {
    name: "playerSkip",
    type: "player",
    once: false,
    execute(queue, track) {
        queue.metadata.send(`Skipping **${track.title}** due to an issue!`);
    },
};
