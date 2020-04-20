// Copyright 2020 Emily J. / mudkipscience. Subject to the AGPLv3 license.

const Discord = require('discord.js')
module.exports = async (client, guild) => {
  client.logger.info('Guild joined.')

  // Create DB entry for newly joined guild
  try {
    await client.findOrCreateGuild(guild)
  } catch (err) {
    client.logger.error('Failed to create DB entry for newly joined guild: ' + err)
  }

  if (client.devmode === false) {
    const channel = client.channels.cache.get(client.config.support.serverLogs)
    // check if has perms, channel exists
    const embed = new Discord.MessageEmbed()
    embed.setColor('#F38159')
    embed.setDescription(`Joined a new server with \`${guild.members.cache.size}\` members! I'm now in \`${client.guilds.cache.size}\` servers.`)
    channel.send(embed)
  }
}
