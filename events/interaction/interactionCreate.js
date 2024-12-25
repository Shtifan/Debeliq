const { Events } = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    type: "interaction",
    once: false,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
                });
            }
        }
        if (interaction.isButton()) {
            const commandName = interaction.message.interaction?.commandName;
            if (!commandName) return;

            const command = interaction.client.commands.get(commandName);
            if (!command || !command.handleButton) return;

            try {
                await command.handleButton(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: "There was an error while processing the button click!",
                    ephemeral: true,
                });
            }
        }
    },
};
