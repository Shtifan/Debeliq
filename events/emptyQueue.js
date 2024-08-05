module.exports = {
    name: "emptyQueue",
    type: "player",
    once: false,
    execute(queue) {
        queue.metadata.channel.send("Queue finished.");
    },
};
