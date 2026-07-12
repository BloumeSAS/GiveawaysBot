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

  // Check Admin permission if command is adminOnly
  if (command.adminOnly) {
    const hasAccess = await hasAdminAccess(client, message);
    if (!hasAccess) {
      const denyEmbed = createEmbed(
        "❌ Accès refusé",
        "Vous n'avez pas la permission ou le rôle requis pour exécuter cette commande d'administration.",
        message.serverId
      );
      return message.reply({ embeds: [denyEmbed] });
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
      console.error("Impossible d'envoyer le message d'erreur :", replyError);
    }
  }
};
