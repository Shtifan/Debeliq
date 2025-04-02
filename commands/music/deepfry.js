const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deepfry")
        .setDescription("Toggles deepfry effect on the current song")
        .addNumberOption((option) =>
            option
                .setName("intensity")
                .setDescription("The intensity of the deepfry effect (0-100)")
                .setMinValue(0)
                .setMaxValue(100)
                .setRequired(false)
        ),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);
        if (!queue || !queue.node.isPlaying()) {
            await interaction.reply({
                content: "There is no music currently playing.",
                ephemeral: true,
            });
            return;
        }

        const intensity = interaction.options.getNumber("intensity") ?? 50;
        const activeFilters = queue.filters.ffmpeg.filters;
        const isDeepfried = activeFilters.some((filter) => filter.includes("bass") || filter.includes("acrusher"));

        if (isDeepfried) {
            queue.filters.ffmpeg.setFilters([]);
            await interaction.reply("Removed deepfry effect.");
        } else {
            const bassGain = 2 + intensity / 25;
            const trebleGain = 1 + intensity / 50;
            const crusherLevel = 2 + intensity / 12.5;
            const bits = 8 + intensity / 12.5;

            queue.filters.ffmpeg.setFilters([
                `bass=g=${bassGain}:f=50`,
                `treble=g=${trebleGain}`,
                `acrusher=level_in=${crusherLevel}:level_out=${crusherLevel * 2}:bits=${bits}`,
            ]);

            await interaction.reply(`Added deepfry effect with ${intensity}% intensity`);
        }
    },
};
