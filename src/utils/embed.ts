import { APIEmbed, EmbedData, EmbedBuilder } from 'discord.js'

export function createEmbed(data?: APIEmbed | EmbedData) {
  const embed = new EmbedBuilder(data)
  embed.setColor('#5B9141')

  return embed
}
