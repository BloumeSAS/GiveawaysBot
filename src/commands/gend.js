const { createEmbed } = require('../utils/embed');
const { getGiveaways, endGiveaway } = require('../utils/giveawayManager');

module.exports = {
  name: 'gend',
  description: 'Finit immédiatement un giveaway actif (par index de !glist, par ID ou le plus récent)',
  adminOnly: true,
  async execute(client, message, args) {
    const serverId = message.serverId;
    const giveaways = getGiveaways(serverId);
    
    // Get active giveaways for this server (matching order of glist)
    const active = giveaways.filter(g => g.status === 'active');

    if (active.length === 0) {
      const noActiveEmbed = createEmbed(
        "❌ Aucun concours actif",
        "Il n'y a aucun concours actif en cours d'exécution sur ce serveur.",
        serverId
      );
      return message.reply({ embeds: [noActiveEmbed] });
    }

    let targetGiveaway = null;

    if (args.length === 0) {
      // Default: Target the latest active giveaway (last one created)
      targetGiveaway = active[active.length - 1];
    } else {
      const input = args[0];
      // Check if input is a small index number (e.g. "1")
      if (/^\d+$/.test(input) && parseInt(input, 10) <= active.length) {
        const index = parseInt(input, 10) - 1;
        targetGiveaway = active[index];
      } else {
        // Otherwise treat it as a full messageId
        targetGiveaway = giveaways.find(g => g.messageId === input);
      }
    }

    if (!targetGiveaway) {
      const notFoundEmbed = createEmbed(
        "❌ Concours introuvable",
        "Aucun concours correspondant n'a été trouvé. Spécifiez un index de `!glist` ou un ID de message valide.",
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

    if (targetGiveaway.status !== 'active') {
      const alreadyEndedEmbed = createEmbed(
        "⚠️ Concours déjà terminé",
        `Le concours pour **${targetGiveaway.prize}** est déjà terminé.`,
        serverId
      );
      return message.reply({ embeds: [alreadyEndedEmbed] });
    }

    // Force end the giveaway
    await endGiveaway(client, targetGiveaway.messageId, true);

    const successEmbed = createEmbed(
      "✅ Concours terminé",
      `Le concours pour **${targetGiveaway.prize}** a été arrêté avec succès et le tirage au sort a été effectué.`,
      serverId
    );
    await message.reply({ embeds: [successEmbed] });
  }
};
