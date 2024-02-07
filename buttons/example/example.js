const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
    data: {
        name: "examplebutton",
        description: "Example button command",
    },
    async execute(interaction) {
        const row = new MessageActionRow().addComponents(
            new MessageButton().setCustomId("example_button").setLabel("Example Button").setStyle("PRIMARY")
        );

        await interaction.reply({ content: "Click the button below:", components: [row] });

        const filter = (i) => i.customId === "example_button" && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on("collect", async (i) => {
            await i.update({ content: "Button clicked!", components: [] });
            collector.stop();
        });

        collector.on("end", () => {
            if (interaction.channel) {
                interaction.editReply({ content: "Button interaction ended.", components: [] });
            }
        });
    },
};
