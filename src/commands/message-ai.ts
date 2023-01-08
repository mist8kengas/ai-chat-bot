import { Command } from '..'
import { SlashCommandBuilder } from '@discordjs/builders'

function filterString(data: string) {
  return '```\n' + data + '\n```'
}

function filterResponse(response: string | undefined) {
  if (!response) return

  const filterExp = new RegExp(
    /^The AI is the character C\.C\. from Code:Geass\nHuman: (?:.*)\nAI: (.*)$/
  )
  const [, filteredResponse] = filterExp.exec(response) || []
  return filteredResponse
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
    const model = 'text-davinci-003' // use "text-davinci-003" or "text-curie-001"

    // create embed
    const responseEmbed = client.createEmbed({
      title: 'とある対話',
      description: filterString(['🧩', 'Thinking...'].join(' ')),
      fields: [
        {
          name: 'Prompt',
          value: filterString(prompt || '< No prompt given >'),
        },
      ],
      timestamp: new Date(),
    })
    responseEmbed.setAuthor({
      url: 'https://github.com/mist8kengas/ai-chat-bot',
      name: 'AIちゃん',
      iconURL: client.user?.avatarURL() || undefined,
    })
    responseEmbed.setFooter({
      text: model,
      iconURL:
        'https://raw.githubusercontent.com/mist8kengas/ai-chat-bot/master/assets/openai-logo-white.png',
    })
    await interaction.reply({ embeds: [responseEmbed] })

    // openai things
    const maxResponseLength = 2 ** 12 // 4,096
    const textCompletion = await client.openai
      .createCompletion({
        model,

        // character: c.c.
        prompt: `The AI is the character C.C. from Code:Geass\nHuman: ${prompt}\nAI:`,
        stop: ['Human: ', 'AI: '],

        max_tokens: maxResponseLength / 4,
        echo: true,

        // chat preset
        temperature: 0.9,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        best_of: 1,

        user: interaction.user.id,
      })
      .catch(error => {
        console.error('[openai:createCompletion:error]', error)
        return null
      })

    if (textCompletion === null)
      return interaction.editReply({
        embeds: [
          responseEmbed.setDescription(
            `:warning: An error occured while trying to generate a response.`
          ),
        ],
      })

    const [textChoices] = textCompletion.data.choices
    const response = filterResponse(textChoices.text)

    console.log('[textCompletion]', textCompletion.data, { response })

    // limit response to maxResponseLength with ellipses at the end
    function limitResponse(response: string, maxLength: number) {
      if (response.length > maxLength)
        return response.substring(0, maxResponseLength - 3) + '...'
      return response
    }

    responseEmbed.setDescription(
      filterString(
        response
          ? limitResponse(response, maxResponseLength)
          : '< No response >'
      )
    )

    responseEmbed.setFields([
      {
        name: 'Prompt',
        value: filterString(prompt || '< No prompt given >'),
      },
    ])

    // final reply
    interaction.editReply({ embeds: [responseEmbed] })

    // add cooldown to command issuer
    client.commandCooldown.add(interaction.user.id)
  },
}
export default command
