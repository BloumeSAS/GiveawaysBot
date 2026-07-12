const { createEmbed } = require('../utils/embed');
const { getGiveaways } = require('../utils/giveawayManager');

module.exports = {
  name: 'glist',
  description: 'Liste les giveaways actifs sur ce serveur',
  adminOnly: false,
  async execute(client, message, args) {
    const serverId = message.serverId;
    const giveaways = getGiveaways(serverId);
    
    // Filter active giveaways that belong to this server
    const active = giveaways.filter(g => g.status === 'active');

    const embed = createEmbed("📊 Concours Actifs", null, serverId);

    if (active.length === 0) {
      embed.setDescription("Aucun concours n'est actuellement en cours sur ce serveur. Restez à l'écoute ! 📢");
      return message.reply({ embeds: [embed] });
    }

    let description = "Voici la liste des concours en cours d'exécution sur ce serveur :\n\n";

    active.forEach((g, index) => {
      const remainingTime = g.endAt - Date.now();
      const timeStr = remainingTime > 0 
        ? `${Math.round(remainingTime / 60000)} minute(s)` 
        : "Fin imminente";
        
      const dateStr = new Date(g.endAt).toLocaleString('fr-FR');

      description += `**${index + 1}. 🎉 ${g.prize}**\n` +
                     `• **Gagnant(s) :** ${g.winnerCount}\n` +
                     `• **Temps restant :** ~${timeStr}\n` +
                     `• **Date de fin :** ${dateStr}\n` +
                     `• **Salon :** <#${g.channelId}>\n` +
                     `• **Message ID :** \`${g.messageId}\`\n\n`;
    });

    embed.setDescription(description);
    await message.reply({ embeds: [embed] });
  }
};
