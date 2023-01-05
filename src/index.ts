// other imports
import dotenv from 'dotenv'
import { readdirSync } from 'fs'

// openai imports
import { Configuration, OpenAIApi } from 'openai'

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
import { createEmbed } from './utils/embed'
import interactionCreate from './handlers/interactionCreate'

//
// setup .env
dotenv.config({ encoding: 'utf8' })
const { OPENAI_KEY, BOT_TOKEN } = process.env

//
// setup openai
const openaiConfig = new Configuration({ apiKey: OPENAI_KEY })
const openai = new OpenAIApi(openaiConfig)

//
// setup discord
export interface ExtendedClient extends Client {
  commands: Collection<string, Command>
  createEmbed: typeof createEmbed
  commandCooldown: {
    list: Collection<Snowflake, Date>
    add: (id: Snowflake) => Collection<Snowflake, Date> | null
  }
  openai: OpenAIApi
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
client.openai = openai

// cooldown
const commandCooldownList = new Collection<Snowflake, Date>()
client.commandCooldown = {
  list: commandCooldownList,
  add: id => {
    if (commandCooldownList.get(id)) return null

    const cooldown = 5e3 // 5 second cooldown
    return commandCooldownList.set(id, new Date(Date.now() + cooldown))
  },
}

client.once('ready', async () => {
  if (!client.user) return
  const { user, guilds } = client
  console.log(
    '[bot]',
    `Logged in as: ${user?.tag}`,
    `in ${guilds.cache.size} servers`
  )

  // listen to user commands
  client.on('interactionCreate', (interaction: Interaction) =>
    interactionCreate(client, interaction)
  )
})

client.login(BOT_TOKEN).catch(error => console.error('[bot:error]', error))
