const { useMainPlayer } = require('discord-player');
const player = useMainPlayer();

player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`Started playing: **${track.title}** 🎧`);
});

player.events.on('audioTracksAdd', (queue, track) => {
    queue.metadata.channel.send(`Multiple Track's queued ✅`);
});

player.events.on('disconnect', queue => {
    queue.metadata.channel.send('Looks like my job here is done, leaving now! ✅');
});

player.events.on('emptyChannel', queue => {
    queue.metadata.channel.send(`Leaving because no vc activity for the past 5 minutes ✅`);
});

player.events.on('emptyQueue', queue => {
    queue.metadata.channel.send('Queue finished! ✅');
});

player.events.on('error', (queue, error) => {
    console.log(`General player error event: ${error.message}`);
    console.log(error);
});

player.events.on('playerError', (queue, error) => {
    console.log(`Player error event: ${error.message}`);
    console.log(error);
});
