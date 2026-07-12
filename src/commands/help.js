const { createEmbed } = require('../utils/embed');

module.exports = {
  name: 'help',
  description: "Affiche le menu d'aide du bot",
  adminOnly: false,
  async execute(client, message, args) {
    const serverId = message.serverId;
    const embed = createEmbed("📚 Menu d'aide - Giveaways Bot", null, serverId)
      .setDescription("Voici la liste des commandes disponibles pour le bot de concours (giveaway).")
      .addFields(
        {
          name: "📢 Commandes Publiques",
          value:
            "• `!help` : Affiche ce menu d'aide.\n" +
            "• `!glist` : Affiche la liste des concours actifs en cours.\n" +
            "• `!invite` : Affiche le lien d'invitation du bot."
        },
        {
          name: "🛡️ Commandes d'Administration",
          value:
            "• `!gstart <temps> <gagnants> <lot>` : Démarre un nouveau concours.\n" +
            "  *Exemple :* `!gstart 10m 2 Nitro Boost` (m = min, h = heures, d = jours)\n" +
            "• `!gend [index/messageId]` : Termine immédiatement un concours actif et procède au tirage.\n" +
            "  *Astuce :* Sans argument, termine le **dernier concours actif lancé**. Sinon, utilisez l'index de `!glist` (ex: `!gend 1`).\n" +
            "• `!greroll [index/messageId]` : Effectue un nouveau tirage pour un concours terminé.\n" +
            "  *Astuce :* Sans argument, relance le **dernier concours terminé**. Sinon, utilisez l'index de récence (ex: `!greroll 1` pour le dernier terminé, `!greroll 2` pour l'avant-dernier)."
        }
      );

    await message.reply({ embeds: [embed] });
  }
};
