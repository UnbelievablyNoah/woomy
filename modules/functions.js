module.exports = client => {
  // Permission level function
  client.permlevel = message => {
    let permlvl = 0

    const permOrder = client.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1)

    while (permOrder.length) {
      const currentLevel = permOrder.shift()
      if (message.guild && currentLevel.guildOnly) continue
      if (currentLevel.check(message)) {
        permlvl = currentLevel.level
        break
      }
    }
    return permlvl
  }

  // Loads commands
  client.loadCommand = (commandName) => {
    try {
      const props = require(`../commands/${commandName}`)
      if (props.init) {
        props.init(client)
      }
      client.commands.set(props.help.name, props)
      // So commands can each have their own cooldown time
      client.cooldown.set(props.help.name, new Map())
      props.conf.aliases.forEach(alias => {
        client.aliases.set(alias, props.help.name)
      })
      return false
    } catch (e) {
      return `Failed to load ${commandName}: ${e}`
    }
  }

  // Command unloader
  client.unloadCommand = async (commandName) => {
    let command
    if (client.commands.has(commandName)) {
      command = client.commands.get(commandName)
    } else if (client.aliases.has(commandName)) {
      command = client.commands.get(client.aliases.get(commandName))
    }
    if (!command) return `The command \`${commandName}\` doesn't seem to exist, nor is it an alias. Try again!`

    if (command.shutdown) {
      await command.shutdown(client)
    }
    const mod = require.cache[require.resolve(`../commands/${command.help.name}`)]
    delete require.cache[require.resolve(`../commands/${command.help.name}.js`)]
    for (let i = 0; i < mod.parent.children.length; i++) {
      if (mod.parent.children[i] === mod) {
        mod.parent.children.splice(i, 1)
        break
      }
    }
    return false
  }

  // Clean up input to remove @everyone, token, etc
  client.clean = async (client, text) => {
    if (text && text.constructor.name === 'Promise') {
      text = await text
    }
    if (typeof text !== 'string') {
      text = require('util').inspect(text, { depth: 1 })
    }
    text = text
      .replace(/`/g, '`' + String.fromCharCode(8203))
      .replace(/@/g, '@' + String.fromCharCode(8203))
      .replace(client.token, 'mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0')

    return text
  }

  // Single line await messages
  client.awaitReply = async (msg, question, limit = 60000) => {
    const filter = m => m.author.id === msg.author.id
    await msg.channel.send(question)
    try {
      const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: limit,
        errors: ['time']
      })
      return collected.first().content
    } catch (e) {
      return false
    }
  }

  client.embedColour = function (guild) {
    if (!guild || guild.member(client.user).displayHexColor === '#000000') {
      return ['#ff9d68', '#ff97cb', '#d789ff', '#74FFFF'].random()
    } else {
      return guild.member(client.user).displayHexColor
    }
  }

  // FIND RANDOM INT BETWEEN TWO INTEGERS
  client.intBetween = function (min, max) {
    return Math.round((Math.random() * (max - min)) + min)
  }

  Object.defineProperty(Array.prototype, 'random', {
    value: function() {
      return this[Math.floor(Math.random() * this.length)]
    }
  })

  // `await client.wait(1000);` to 'pause' for 1 second.
  client.wait = require('util').promisify(setTimeout)

  // Find guild members
  client.findMembers = function (guild, search) {
    if (!search || typeof search !== 'string') return

    const members = []
    let member

    // Try mention
    if (search.startsWith('<@') && search.endsWith('>')) {
      let mention = search.slice(2, -1)

      if (mention.startsWith('!')) {
        mention = mention.slice(1)
      }

      return guild.members.cache.get(mention)
    }

    // Try ID search
    if (!isNaN(search) === true) {
      members.push(guild.members.cache.get(search))
      if (members[0]) {
        return members[0]
      }
    }

    // Try username search
    try {
      member = guild.members.cache.find(m => m.displayName.toLowerCase() === search)
      if (!member) {
        guild.members.cache.find(m => m.user.tag.toLowerCase() === search)
      }
    } catch (err) {}
    if (member) {
      members.push(member)
    }
    guild.members.cache.forEach(m => {
      if (m.displayName.toLowerCase().startsWith(search) || m.user.tag.toLowerCase().startsWith(search)) {
        members.push(m)
      }
    })

    return members
  }

  client.findRole = function (guild, search) {
    var role
    role = guild.roles.cache.find(r => r.name.toLowerCase() === search.toLowerCase())
    if (!role) {
      role = guild.roles.cache.get(search.toLowerCase())
    }

    if (!role) {
      return
    }

    return role
  }

  // Both of these functions catch errors and log them
  process.on('uncaughtException', (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './')
    client.logger.fatal(`Uncaught Exception: ${errorMsg}`)
    process.exit(1)
  })

  process.on('unhandledRejection', err => {
    client.logger.error(`Unhandled rejection: ${err}`)
  })
}
