const { EmbedBuilder } = require('discord.js')

module.exports = {
    name: 'help',
    description: "All the commands this bot has!",
    showHelp: false,

    execute({ client, inter }) {
        const commands = client.commands.filter(x => x.showHelp !== false)

        const embed = new EmbedBuilder()
            .setColor('#ec4444')
            .setDescription('[Invite Debeliq](https://discord.com/api/oauth2/authorize?client_id=925051733510594561&permissions=8&scope=bot%20applications.commands)')
            .addFields([{ name: 'Prefix', value: `\`${client.config.app.prefix}\`` }])
            .addFields([{ name: 'Slash Commands', value: commands.map(x => `\`${x.name}\``).join(' ') }])
            .addFields([{ name: 'With Prefix', value: '`delete` `rng` `cb (cows and bulls)` `koi te e pital`' }])
            .addFields([{ name: 'Version', value: '1.5' }])

        inter.reply({ embeds: [embed] })
    },
}