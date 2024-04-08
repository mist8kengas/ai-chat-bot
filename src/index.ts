// other imports
import dotenv from 'dotenv'
import { readdirSync } from 'fs'

// discord imports
import {
  GatewayIntentBits,
  Client,
  Collection,
  Interaction,
  CommandInteraction,
  Snowflake,
} from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

// abstraction function imports
import { createEmbed } from './utils/embed.js'
import interactionCreate from './handlers/interactionCreate.js'

// openai imports
import type { ClientOptions } from 'openai'

//
// setup .env
dotenv.config({ encoding: 'utf8' })
const { OPENAI_KEY, BOT_TOKEN } = process.env

//
// setup openai
const openaiConfig = { apiKey: OPENAI_KEY } satisfies ClientOptions

//
// setup discord
export interface ExtendedClient extends Client {
  commands: Collection<string, Command>
  createEmbed: typeof createEmbed
  commandCooldown: {
    list: Collection<Snowflake, Date>
    add: (id: Snowflake) => Collection<Snowflake, Date> | null
  }
  openaiConfig: ClientOptions
}
export interface Command {
  data: SlashCommandBuilder
  name: string
  description: string
  usage?: string
  /**
   * @description Enable this if the command has a cooldown
   */
  cooldown?: boolean
  execute: (data: {
    client: ExtendedClient
    interaction: CommandInteraction
  }) => Promise<any>
}

// create discord client
const client = new Client({
  intents: [
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
  ],
}) as ExtendedClient

// cheese
client.commands = new Collection()

// commander
const commandFiles = readdirSync('./dist/commands').filter(cmd =>
  cmd.endsWith('.js')
)
for (const name of commandFiles) {
  const { default: command } = (await import(`./commands/${name}`)) as {
    default: Command
  }
  client.commands.set(command.name, command)
}

// utils functions
client.createEmbed = createEmbed

// openai extension
client.openaiConfig = openaiConfig

// cooldown
const commandCooldownList = new Collection<Snowflake, Date>()
client.commandCooldown = {
  list: commandCooldownList,
  add: id => {
    if (commandCooldownList.get(id)) return null

    const cooldown = 10e3 // 10 second cooldown
    return commandCooldownList.set(id, new Date(Date.now() + cooldown))
  },
}

console.time('client-ready')
client.once('ready', async () => {
  console.timeEnd('client-ready')

  // listen to user commands
  client.on('interactionCreate', (interaction: Interaction) =>
    interactionCreate(client, interaction)
  )
})

if (BOT_TOKEN)
  client
    .login(BOT_TOKEN)
    .then(() => {
      if (client.user) {
        const { user, guilds } = client
        console.log(
          '[bot]',
          `Logged in as: ${user?.tag}`,
          `in ${guilds.cache.size} servers`
        )
      }
    })
    .catch(error => console.error('[bot:error]', error))
else throw new Error("No bot token, can't login! exiting.")
