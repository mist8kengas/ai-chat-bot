import { ExtendedClient } from '..'
import { Message, time, TimestampStyles } from 'discord.js'

import chatAi from '../utils/chatAi.js'
import { ChatCompletionMessageParam } from 'openai/resources'

export default async function messageCreate(
  client: ExtendedClient,
  message: Message
) {
  // sanity check
  if (!client.user) return

  // don't handle if message was sent by a bot
  if (message.author.bot) return

  // only respond to messages that the bot was mentioned in
  if (!message.mentions.has(client.user)) return

  // exit if bot can't message in channel
  if (message.inGuild() && !message.channel.permissionsFor(client.user)) return

  // only respond to messages if the content size is 512 characters or less
  if (message.content.length > 2 ** 9) return

  // check cooldown
  const cooldown = client.commandCooldown.list.get(
    message.inGuild() ? message.guildId : message.author.id
  )
  console.log('cooldown', [cooldown, cooldown?.getTime() || 0 > Date.now()])
  if (cooldown && cooldown.getTime() > Date.now()) {
    return void (await message.reply({
      content: [
        '⏳ Please wait before talking to the bot again.',
        `You may try again ${time(cooldown, TimestampStyles.RelativeTime)}`,
      ].join(' '),
      options: { ephemeral: true },
    }))
  } else client.commandCooldown.list.delete(message.author.id)

  // add ".. is typing"
  await message.channel.sendTyping()

  const history: ChatCompletionMessageParam[] = []

  // if the message is a reply to the bot, include the bot's message in the context
  if (message.reference)
    history.push({
      role: 'assistant',
      content: (await message.fetchReference()).cleanContent,
    })

  const chatCompletion = await chatAi(
    client.openaiConfig,
    {
      user: message.author.id,
      name: message.author.username,
      prompt: message.cleanContent,
    },
    void 0,
    history
  )

  if (!chatCompletion) return
  const [textChoices] = chatCompletion.choices
  const response = textChoices.message.content

  console.debug('[chat:textCompletion]', {
    message,
    chatCompletion,
    response,
  })

  if (response) message.reply({ content: response })

  // add command cooldown to guild
  // or user if in direct messages
  client.commandCooldown.add(
    message.inGuild() ? message.guildId : message.author.id
  )
}
