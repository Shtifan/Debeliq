const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('help').setDescription('Shows how to use non-slash commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ec4444')
            .setDescription(
                '[**Invite Debeliq**](https://discord.com/api/oauth2/authorize?client_id=925051733510594561&permissions=8&scope=bot%20applications.commands)'
            )
            .addFields([
                {
                    name: 'Cows and Bulls',
                    value: '**```debel cb```**',
                },
            ])
            .addFields([
                {
                    name: 'Koi te e pital',
                    value: '**```koi```**',
                },
            ]);
        await interaction.reply({ embeds: [embed] });
    },
};
