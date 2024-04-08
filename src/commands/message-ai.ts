import { Command } from '..'
import { SlashCommandBuilder } from '@discordjs/builders'

import OpenAI from 'openai'
import chatAi, { defaultModel } from '../utils/chatAi.js'
import { ChatCompletionMessageParam } from 'openai/resources'

/**
 * Filters extra whitespace from text
 */
function filterText(data: string) {
  const pattern = new RegExp(/^(?:[\n]+|)(?<text>[^\0]+)$/)
  const filter = pattern.exec(data)
  if (filter) return filter.groups?.text
}

/**
 * Formats string to a Discord embed-friendly format
 */
function formatString(data: string) {
  return '```\n' + filterText(data) + '\n```'
}

/**
 * Filters OpenAI message completion to only include the response (and prompt)
 *
 * @deprecated
 */
function filterResponse(response: string | undefined) {
  if (!response) return

  const pattern = new RegExp(
    /^(?<context>[^\0]+)\nHuman: (?<prompt>[^\0]+)\nAI:([\s]+|)(?<response>[^\0]+)$/
  )
  const filter = pattern.exec(response)
  if (filter) return filter.groups?.response
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('message-ai')
    .setDescription('Talk to the bot')
    .addStringOption(option =>
      option
        .setName('prompt')
        .setDescription('Message prompt to send to the bot')
        .setMaxLength(2 ** 9) // maximum prompt length of 512 characters
        .setRequired(true)
    ) as SlashCommandBuilder,
  name: 'message-ai',
  description: 'Talk to the bot',
  cooldown: true,
  async execute({ client, interaction }) {
    if (!interaction.isChatInputCommand()) return

    const prompt = interaction.options.getString('prompt', true)

    // create embed
    const responseEmbed = client.createEmbed({
      author: {
        url: 'https://github.com/mist8kengas/ai-chat-bot',
        name: 'AIちゃん',
        iconURL: client.user?.avatarURL() || undefined,
      },
      description: formatString(['🧩', 'Thinking...'].join(' ')),
      fields: [
        {
          name: 'Prompt',
          value: formatString(prompt || '< No prompt given >'),
        },
      ],
      footer: {
        text: defaultModel,
        iconURL:
          'https://raw.githubusercontent.com/mist8kengas/ai-chat-bot/master/assets/openai-logo-white.png',
      },
      timestamp: new Date(),
    })
    await interaction.reply({ embeds: [responseEmbed] })

    // openai things
    const maxResponseLength = 2 ** 12 // 4,096
    const chatCompletion = await chatAi(client.openaiConfig, {
      user: interaction.user.id,
      name: interaction.user.username,
      prompt,
    })

    if (chatCompletion === null)
      return interaction.editReply({
        embeds: [
          responseEmbed.setDescription(
            `:warning: An error occured while trying to generate a response.`
          ),
        ],
      })

    const [textChoices] = chatCompletion.choices
    const response = textChoices.message.content

    console.debug('[interaction:textCompletion]', {
      interaction,
      chatCompletion,
      response,
    })

    // limit response to maxResponseLength with ellipses at the end
    function limitResponse(response: string, maxLength: number) {
      if (response.length > maxLength)
        return response.substring(0, maxResponseLength - 3).trimEnd() + '...'
      return response
    }

    responseEmbed.setDescription(
      formatString(
        response
          ? limitResponse(response, maxResponseLength)
          : '< No response >'
      )
    )

    // final reply
    interaction.editReply({ embeds: [responseEmbed] })

    // add command cooldown to guild
    // or user if in direct messages
    if (interaction.inGuild()) client.commandCooldown.add(interaction.guildId)
    else client.commandCooldown.add(interaction.user.id)
  },
}
export default command
