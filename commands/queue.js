const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Shows the next 10 songs in the queue'),

  async execute(interaction) {
    const channel = interaction.member.voice.channel;
    if (!channel)
      return interaction.reply({
        content: 'You are not connected to a voice channel',
        ephemeral: true,
      });

    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.node.isPlaying())
      return interaction.reply({
        content: `There is no music currently playing`,
        ephemeral: true,
      });

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('**Queue**')
      .setDescription(
        `**Current**: ${queue.currentTrack.title} | ${queue.currentTrack.author}\n\n` +
        queue.tracks
          .map((track, i) => {
            return `**#${i + 1}** - Title: **${track.title}** | Uploaded by: **${track.author}**`;
          })
          .slice(0, 10)
          .join('\n')
      );

    return interaction.reply({ embeds: [embed] });
  },
};
