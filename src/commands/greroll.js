const { createEmbed } = require('../utils/embed');
const { getGiveaways, rerollGiveaway } = require('../utils/giveawayManager');

module.exports = {
  name: 'greroll',
  description: 'Tire un nouveau gagnant pour un giveaway terminé (par récence, index ou ID)',
  adminOnly: true,
  async execute(client, message, args) {
    const serverId = message.serverId;
    const giveaways = getGiveaways(serverId);
    
    // Get ended giveaways for this server, sorted by end time descending (most recent first)
    const ended = giveaways
      .filter(g => g.status === 'ended')
      .sort((a, b) => b.endAt - a.endAt);

    if (ended.length === 0) {
      const noEndedEmbed = createEmbed(
        "❌ Aucun concours terminé",
        "Aucun concours terminé n'a été trouvé sur ce serveur.",
        serverId
      );
      return message.reply({ embeds: [noEndedEmbed] });
    }

    let targetGiveaway = null;

    if (args.length === 0) {
      // Default: Target the most recent ended giveaway
      targetGiveaway = ended[0];
    } else {
      const input = args[0];
      // Check if input is a small index number (e.g. "1" = latest ended, "2" = second latest)
      if (/^\d+$/.test(input) && parseInt(input, 10) <= ended.length) {
        const index = parseInt(input, 10) - 1;
        targetGiveaway = ended[index];
      } else {
        // Otherwise treat it as a full messageId
        targetGiveaway = giveaways.find(g => g.messageId === input);
      }
    }

    if (!targetGiveaway) {
      const notFoundEmbed = createEmbed(
        "❌ Concours introuvable",
        "Aucun concours correspondant n'a été trouvé. Spécifiez un index de récence (ex: `1` pour le dernier terminé) ou un ID de message valide.",
        serverId
      );
      return message.reply({ embeds: [notFoundEmbed] });
    }

    // Verify server security
    if (targetGiveaway.serverId !== serverId) {
      const wrongServerEmbed = createEmbed(
        "❌ Action interdite",
        "Ce concours n'appartient pas à ce serveur.",
        serverId
      );
      return message.reply({ embeds: [wrongServerEmbed] });
    }

    if (targetGiveaway.status !== 'ended') {
      const notEndedEmbed = createEmbed(
        "⚠️ Concours en cours",
        `Le concours avec l'ID \`${targetGiveaway.messageId}\` est toujours actif. Utilisez \`!gend\` pour le terminer d'abord.`,
        serverId
      );
      return message.reply({ embeds: [notEndedEmbed] });
    }

    const success = await rerollGiveaway(client, targetGiveaway.messageId);

    if (success) {
      const successEmbed = createEmbed(
        "✅ Reroll effectué",
        `Un nouveau gagnant a été tiré au sort avec succès pour le concours **${targetGiveaway.prize}**.`,
        serverId
      );
      await message.reply({ embeds: [successEmbed] });
    } else {
      const failedEmbed = createEmbed(
        "❌ Échec du Reroll",
        "Une erreur est survenue lors du tirage ou aucun participant n'a été trouvé.",
        serverId
      );
      await message.reply({ embeds: [failedEmbed] });
    }
  }
};
