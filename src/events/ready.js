const { getGiveaways, scheduleGiveaway } = require('../utils/giveawayManager');

/**
 * @param {import('bloumechat').BloumeChat} client 
 */
module.exports = (client) => {
  console.log(`========================================`);
  console.log(`🤖 Bot Giveaway BloumeChat en ligne !`);
  console.log(`👤 Nom : ${client.user ? client.user.tagString : 'Inconnu'}`);
  console.log(`🆔 ID  : ${client.user ? client.user.id : 'Inconnu'}`);
  console.log(`========================================`);

  // Set default activity
  client.setActivity({
    type: "playing",
    name: "!help | Giveaways Bot"
  }).catch(err => {
    console.error("Impossible de définir l'activité :", err);
  });

  // Scan and initialize configuration files for all current servers
  try {
    const { getSettings } = require('../utils/settingsManager');
    for (const guild of client.guilds.cache.values()) {
      getSettings(guild.id);
    }
  } catch (err) {
    console.error("[Ready Event] Erreur lors de l'initialisation des configurations :", err.message);
  }

  // Reload and reschedule active giveaways
  try {
    const giveaways = getGiveaways();
    const activeGiveaways = giveaways.filter(g => g.status === 'active');

    if (activeGiveaways.length > 0) {
      console.log(`[Ready Event] Restauration de ${activeGiveaways.length} giveaway(s) actif(s)...`);
      for (const giveaway of activeGiveaways) {
        scheduleGiveaway(client, giveaway);
      }
    } else {
      console.log(`[Ready Event] Aucun giveaway actif à restaurer.`);
    }
  } catch (error) {
    console.error("Erreur lors du rechargement des giveaways au démarrage :", error);
  }
};
