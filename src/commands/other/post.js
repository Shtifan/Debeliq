const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('post')
        .setDescription('Sends a post from Reddit')
        .addStringOption(option => option.setName('subreddit').setDescription('The subreddit to take a random post from').setRequired(true)),

    async execute(interaction) {
        await fetch(`https://www.reddit.com/r/${interaction.options.getString('subreddit')}/random/.json`).then(async r => {
            let post = await r.json();
            try {
                await interaction.reply(post[0].data.children[0].data.url);
            } catch (error) {
                return interaction.reply({
                    content: 'There is no subreddit with that name',
                    ephemeral: true,
                });
            }
        });
    },
};
