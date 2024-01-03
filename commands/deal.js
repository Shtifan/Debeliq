const { SlashCommandBuilder } = require('discord.js');
const client = require('../index.js');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i].value, arr[j].value] = [arr[j].value, arr[i].value];
  }
}

function remove(number, arr) {
  const index = arr.findIndex(c => c.number == number);
  arr.splice(index, 1);
}

function remainingValues(cases) {
  let remainingValues = cases.map(c => `$${c.value.toLocaleString()}`);
  let sortedValues = remainingValues.sort((a, b) => a.replace(/[\$,]/g, '') - b.replace(/[\$,]/g, '')).join('\n');

  return `Remaining values:\n${sortedValues}`;
}

function remainingNumbers(cases) {
  let numbers = '';

  cases.forEach(c => {
    numbers += `${c.number}, `;
  });

  numbers = numbers.slice(0, -2);

  return `Remaining cases numbers: ${numbers}`;
}

function getOffer(cases) {
  const averageValue = cases.reduce((total, c) => total + c.value, 0) / cases.length;

  let offerPercentage;
  if (cases.length > 10) {
    offerPercentage = 0.2;
  } else {
    offerPercentage = 0.1;
  }

  const offer = averageValue * offerPercentage;

  return offer.toFixed(2);
}

let gamedeal = false;

module.exports = {
  data: new SlashCommandBuilder().setName('deal').setDescription('Play deal or no deal'),

  async execute(interaction) {
    cases = [
      { number: 1, value: 0.01 },
      { number: 2, value: 1 },
      { number: 3, value: 5 },
      { number: 4, value: 10 },
      { number: 5, value: 25 },
      { number: 6, value: 50 },
      { number: 7, value: 75 },
      { number: 8, value: 100 },
      { number: 9, value: 200 },
      { number: 10, value: 300 },
      { number: 11, value: 400 },
      { number: 12, value: 500 },
      { number: 13, value: 750 },
      { number: 14, value: 1000 },
      { number: 15, value: 5000 },
      { number: 16, value: 10000 },
      { number: 17, value: 25000 },
      { number: 18, value: 50000 },
      { number: 19, value: 75000 },
      { number: 20, value: 100000 },
      { number: 21, value: 200000 },
      { number: 22, value: 300000 },
      { number: 23, value: 400000 },
      { number: 24, value: 500000 },
      { number: 25, value: 750000 },
      { number: 26, value: 1000000 },
    ];
    shuffle(cases);
    yourCase = 0;
    gamedeal = true;
    acceptingDeal = false;

    let reply = '';
    reply += 'The deal or no deal game has started.\n';
    reply += 'These are all the briefcases:\n';
    reply += remainingValues(cases).split('\n').slice(1).join('\n');
    reply += '\nThe briefcases have been shuffled.\n';
    reply += 'Choose your briefcase (1-26):';

    return interaction.reply(reply);
  },
};

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!gamedeal) return;

  let special = [20, 15, 11, 8, 5];
  let reply = '';

  if (message.content.toLowerCase() == 'yes' && acceptingDeal) {
    if (special.includes(cases.length)) {
      reply += `Congratulations! You win **$${getOffer(cases).toLocaleString()}**!\n`;
      gamedeal = false;
    }

    else if (cases.length == 2) {
      let index = cases.findIndex(c => c.number == cases[0].number);
      reply += `Congratulations! You win **$${cases[index].value.toLocaleString()}**!\n`;
      gamedeal = false;
    }
  }

  else if (message.content.toLowerCase() == 'no' && acceptingDeal) {
    if (special.includes(cases.length)) {
      reply += `You declined the offer\n`;
      special.push(2);
      let index = special.indexOf(cases.length);
      let remaining = cases.length - special[index + 1];
      special.pop();
      reply += `Now choose **${remaining}** more cases:\n`;
      acceptingDeal = false;
    }

    else if (cases.length == 2) {
      let index = cases.findIndex(c => c.number == yourCase);
      reply += `Congratulations! You win **$${cases[index].value.toLocaleString()}**!\n`;
      gamedeal = false;
    }
  }

  else {
    if (acceptingDeal) return;

    let input = parseInt(message.content);
    if (isNaN(message.content) || input < 1 || input > 26) return;

    let index = 0;
    if (cases.findIndex(c => c.number == input) == -1) return;
    else index = cases.findIndex(c => c.number == input);

    if (input == yourCase) return;

    if (yourCase == 0) {
      yourCase = input;
      reply += 'Now choose **6** briefcases to reveal:\n';
    }

    else {
      reply += `Behind case **${input}** there were **$${cases[index].value.toLocaleString()}**\n`;
      remove(input, cases);
      reply += `${remainingValues(cases)}\n`;
      reply += `${remainingNumbers(cases)}\n`;

      if (special.includes(cases.length)) {
        reply += `The banker offer is **$${getOffer(cases).toLocaleString()}**\n`;
        reply += 'Do you accept the deal?\n';
        acceptingDeal = true;
      }

      else if (cases.length == 2) {
        reply += 'Do you want to switch your case with the last remaining?\n';
        acceptingDeal = true;
      }
    }
  }

  message.channel.send(reply);
});
