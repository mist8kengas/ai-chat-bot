import { Command, ExtendedClient } from '..'
import { Interaction } from 'discord.js'

export default async function interactionCreate(
  client: ExtendedClient,
  interaction: Interaction
) {
  // if interaction is a chat command
  if (interaction.isCommand()) {
    // get command
    const command: Command | undefined = client.commands.get(
      interaction.commandName
    )

    if (!command) return

    if (command.cooldown) {
      // check cooldown
      const cooldown = client.commandCooldown.list.get(interaction.user.id)
      if (cooldown && cooldown.getTime() > Date.now()) {
        const secondsRemaining = new Date(
          cooldown.getTime() - Date.now()
        ).getUTCSeconds()

        return void interaction.reply({
          embeds: [
            client
              .createEmbed()
              .setDescription(
                `:warning: You must wait ${secondsRemaining} seconds before you can use this command!`
              ),
          ],
        })
      } else client.commandCooldown.list.delete(interaction.user.id)
    }

    command.execute({ client, interaction }).catch(error => {
      console.error('[interaction:error]', error)
      interaction
        .followUp({
          embeds: [
            client
              .createEmbed()
              .setDescription(
                ':warning: An error occured while trying to run this command.'
              ),
          ],
          ephemeral: true,
        })
        .catch(error => console.error('[interaction:error:fatal]', error))
    })
  }
}
