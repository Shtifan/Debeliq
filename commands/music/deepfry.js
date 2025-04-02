const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder().setName("deepfry").setDescription("Toggles deepfry effect"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        if (!queue || !queue.node.isPlaying()) {
            await interaction.reply({
                content: "There is no music currently playing.",
                ephemeral: true,
            });
            return;
        }

        const activeFilters = queue.filters.ffmpeg.filters;
        const isDeepfried = activeFilters.some((filter) => filter.includes("bass") || filter.includes("acrusher"));

        if (isDeepfried) {
            queue.filters.ffmpeg.setFilters([]);
            await interaction.reply("Removed deepfry effect.");
        } else {
            queue.filters.ffmpeg.setFilters(["bass=g=4:f=50", "treble=g=1", "acrusher=level_in=2:level_out=8:bits=14"]);
            await interaction.reply("The song has been deepfried");
        }
    },
};
