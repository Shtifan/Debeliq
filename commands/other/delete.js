const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Deletes messages")
        .addIntegerOption((option) =>
            option.setName("amount").setDescription("Number of messages you want to delete").setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.guild.members.me.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.ManageMessages)) {
            await interaction.reply({
                content: "I do not have permission to delete messages in this channel.",
                ephemeral: true,
            });
            return;
        }

        let amount = interaction.options.getInteger("amount");
        if (amount > 100) amount = 100;

        await interaction.channel.bulkDelete(amount, true).then((messages) => {
            interaction.reply(`I have just deleted **${messages.size}** message${messages.size != 1 ? "s" : ""}.`);
        });
    },
};
