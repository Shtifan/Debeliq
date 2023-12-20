const client = require('./main.js');
const { useMainPlayer } = require('discord-player');
const player = useMainPlayer();

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.includes('koi') || message.content.includes('koj')) {
        message.reply('te e pital');
    }
});

player.events.on('error', (queue, error) => {
    console.log(`General player error event: ${error.message}`);
    console.log(error);
});

player.events.on('playerError', (queue, error) => {
    console.log(`Player error event: ${error.message}`);
    console.log(error);
});

player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`Started playing **${track.title}** in **${queue.channel.name}** 🎵`);
});

player.events.on('audioTrackAdd', (queue, track) => {
    queue.metadata.channel.send(`Track **${track.title}** added to queue ✅`);
});

player.events.on('audioTracksAdd', (queue, track) => {
    queue.metadata.channel.send('Multiple tracks added to queue ✅');
});

player.events.on('playerSkip', (queue, track) => {
    queue.metadata.channel.send(`Skipping **${track.title}** due to an issue ⏭️`);
});

player.events.on('disconnect', queue => {
    queue.metadata.channel.send('Looks like my job here is done, leaving now...');
});

player.events.on('emptyChannel', queue => {
    queue.metadata.channel.send("I'm leaving because there's no one in the voice channel");
});

player.events.on('emptyQueue', queue => {
    queue.metadata.channel.send('Queue finished ✅');
});
