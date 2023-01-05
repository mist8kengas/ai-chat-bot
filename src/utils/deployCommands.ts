import { Command } from '..'
import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'

import * as dotenv from 'dotenv'
dotenv.config()

import { readdirSync } from 'fs'

const { BOT_TOKEN = '', CLIENT_ID = '' } = process.env

const commands: SlashCommandBuilder[] = new Array()

const commandFiles = readdirSync('./dist/commands').filter(cmd =>
  cmd.endsWith('.js')
)
for (const name of commandFiles) {
  const { default: command } = (await import(`../commands/${name}`)) as {
    default: Command
  }
  commands.push(command.data)
}

// add commands
const rest = new REST({ version: '9' }).setToken(BOT_TOKEN)

// register global commands
rest
  .put(Routes.applicationCommands(CLIENT_ID), { body: commands })
  .then(() => console.log('[rest:put]', `Added ${commands.length} commands`))
  .catch((error: Error) => console.error('[rest:put:error]', error))
