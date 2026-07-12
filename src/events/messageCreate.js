const { createEmbed } = require('../utils/embed');
const { hasAdminAccess } = require('../utils/permissionCheck');

/**
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Message} message 
 */
module.exports = async (client, message) => {
  // Ignore messages from bots
  if (message.author && message.author.bot) return;

  const prefix = process.env.PREFIX || '!';
  
  // Check if message content starts with the prefix
  if (!message.content.startsWith(prefix)) return;

  // Split content by whitespace to get command and arguments
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  // Find the command in client.commands
  if (!client.commands) return;
  const command = client.commands.get(commandName);

  if (!command) return;

  console.log(`[Command Execution] !${commandName} par ${message.author.username || 'Inconnu'}`);

  // Resiliency: check if bot has base permissions in the server before executing
  if (message.serverId) {
    try {
      const botMember = await client.members.fetch(message.serverId, client.user.id);
      const { PermissionFlags } = require('bloumechat');
      if (botMember) {
        const canView = botMember.hasPermission(PermissionFlags.VIEW_CHANNELS);
        const canSend = botMember.hasPermission(PermissionFlags.SEND_MESSAGES);
        if (!canView || !canSend) {
          console.warn(`[MessageCreate] Le bot manque de permissions sur le serveur ${message.serverId} (VIEW_CHANNELS: ${canView}, SEND_MESSAGES: ${canSend})`);
          try {
            const dm = await client.createDM(message.author.id);
            await dm.send(`⚠️ **Alerte Permission** : Je ne peux pas exécuter la commande \`!${commandName}\` car je n'ai pas les permissions de base de lire ce salon ou d'y envoyer des messages.`);
          } catch (dmErr) {
            console.error("[MessageCreate] Impossible d'envoyer l'alerte de permission en DM :", dmErr.message);
          }
          return;
        }
      }
    } catch (err) {
      console.warn(`[MessageCreate] Impossible de vérifier les propres permissions du bot :`, err.message);
    }
  }

  // Check Admin permission if command is adminOnly
  if (command.adminOnly) {
    const hasAccess = await hasAdminAccess(client, message);
    if (!hasAccess) {
      const denyEmbed = createEmbed(
        "❌ Accès refusé",
        "Vous n'avez pas la permission ou le rôle requis pour exécuter cette commande d'administration.",
        message.serverId
      );
      try {
        await message.reply({ embeds: [denyEmbed] });
      } catch (replyError) {
        console.error("[MessageCreate] Impossible de répondre Accès refusé :", replyError.message);
      }
      return;
    }
  }

  try {
    // Execute command
    await command.execute(client, message, args);
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande ${commandName} :`, error);
    
    // Create an error embed to notify the user
    const errorEmbed = createEmbed(
      "❌ Une erreur est survenue",
      `Une erreur interne est survenue lors de l'exécution de cette commande.\n\n\`\`\`js\n${error.message}\n\`\`\``,
      message.serverId
    );
    
    try {
      await message.reply({ embeds: [errorEmbed] });
    } catch (replyError) {
      console.error("[MessageCreate] Impossible d'envoyer le message d'erreur dans le salon :", replyError.message);
      // Resilient fallback: DM the user
      try {
        const dm = await client.createDM(message.author.id);
        await dm.send(
          `⚠️ **Erreur lors de l'exécution** : Je n'ai pas pu répondre dans le salon pour la commande \`!${commandName}\`.\n` +
          `*Erreur d'origine :* \`${error.message}\`\n` +
          `*Erreur d'envoi :* \`${replyError.message}\`\n` +
          `Veuillez vérifier que j'ai bien les permissions d'écrire dans ce salon.`
        );
      } catch (dmError) {
        console.error("[MessageCreate] Impossible d'envoyer le DM d'erreur :", dmError.message);
      }
    }
  }
};
