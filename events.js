const client = require('./index');

const prefix = 'debel ';
let gamecb = false;

function hasDuplicates(array) {
    return new Set(array).size !== array.length;
}

function cb(number, input) {
    let bulls = 0;
    let cows = 0;
    for (i = 0; i < number.length; i++) {
        if (number[i] == input[i]) bulls++;
        else if (number.indexOf(input[i]) != -1) cows++;
    }
    return `${bulls} bull${bulls != 1 ? 's' : ''} ${cows} cow${cows != 1 ? 's' : ''}`;
}

function getNumberEnding(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    switch (lastDigit) {
        case 1:
            if (lastTwoDigits != 11) return 'st';
            break;
        case 2:
            if (lastTwoDigits != 12) return 'nd';
            break;
        case 3:
            if (lastTwoDigits != 13) return 'rd';
            break;
    }
    return 'th';
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === 'koi') {
        message.reply('te e pital');
    }

    if (message.content === `${prefix}cb`) {
        gamecb = true;
        guesses = 0;
        number = '';
        let firstDigit = Math.floor(Math.random() * 9) + 1;
        number += firstDigit;
        for (let i = 0; i < 3; i++) {
            let digit = Math.floor(Math.random() * 10);
            while (number.includes(digit.toString()) || (i === 0 && digit === 0)) {
                digit = Math.floor(Math.random() * 10);
            }
            number += digit.toString();
        }
        number.split('').map(Number);
        message.channel.send("I'm ready");
    }

    if (gamecb) {
        let input = message.content.split('').map(Number);
        if (isNaN(message.content) || input.length != 4 || hasDuplicates(input)) return;
        guesses++;

        message.channel.send(cb(number, input));
        if (cb(number, input) === '4 bulls 0 cows') {
            message.channel.send(`Well done, you guessed the number from the ${guesses + getNumberEnding(guesses)} guess`);
            gamecb = false;
            guesses = 0;
        }
    }
});

const { useMasterPlayer } = require('discord-player');
const player = useMasterPlayer();

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
