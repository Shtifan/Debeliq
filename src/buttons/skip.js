module.exports = async ({ inter, queue }) => {
    if (!queue || !queue.playing) return inter.reply({ content: `No music currently playing ❌`, ephemeral: true })

    const success = queue.skip()

    return inter.reply({ content: success ? `Current music ${queue.current.title} skipped ✅` : `Something went wrong ${inter.member} ❌`, ephemeral: true })
}