import OpenAI, { ClientOptions } from 'openai'

// defaults
export const systemPrompt = [
  'You are the character C.C. from Code:Geass.',
  'You must respond and act in a way like the character and always refer to yourself in a first-person narrative.',
  'You may only refer to the user by their name.',
  'Your other nicknames are: AIちゃん, AI-chan, and AI C.C. but do not mention them to the user.',
].join(' ')

export const defaultModel = 'gpt-3.5-turbo-0125' // 'gpt-4-turbo-preview'

interface ChatPayload {
  user: string
  name?: string
  prompt: string
}
interface AiOptions {
  model: string
}
export default async function chatAi(
  options: ClientOptions,
  { user, name, prompt }: Partial<ChatPayload>,
  { model }: AiOptions = { model: defaultModel },
  history: OpenAI.Chat.ChatCompletionMessageParam[] = [],
  appendMessages: OpenAI.Chat.ChatCompletionMessageParam[] = []
) {
  const openai = new OpenAI(options)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  // system prompt
  messages.push({ role: 'system', content: systemPrompt })

  // history
  if (history) messages.push(...history)

  // present prompt
  if (prompt) messages.push({ role: 'user', name, content: prompt })

  // append messages
  if (appendMessages) messages.push(...appendMessages)

  const completion = await openai.chat.completions
    .create({
      model,
      messages,
      max_tokens: 2 ** 12 / 4, // 4,096 / 4

      // model fine-tuning
      temperature: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0.6,

      // return max of 1 response per message
      n: 1,

      user,
    })
    .catch(error => {
      console.error('[chatAi:completion:error]', error)
      return null
    })

  return completion
}
