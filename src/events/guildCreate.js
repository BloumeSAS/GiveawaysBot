const { getSettings } = require('../utils/settingsManager');

/**
 * Handles guildCreate events.
 * Fired when the bot joins a new server.
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Guild} guild The guild joined
 */
module.exports = async (client, guild) => {
  try {
    if (!guild) return;

    const serverId = guild.id;
    console.log(`========================================`);
    console.log(`📥 [GuildJoin] Le bot a rejoint un nouveau serveur !`);
    console.log(`🆔 ID du Serveur : ${serverId}`);
    console.log(`👤 Nom du Serveur : ${guild.name || 'Inconnu'}`);
    
    // Initialize settings file under data/<serverId>.json
    getSettings(serverId);
    
    console.log(`⚙️ [GuildJoin] Configuration initialisée avec succès.`);
    console.log(`========================================`);
  } catch (error) {
    console.error("[GuildJoin Error] Erreur lors de la gestion du join du bot :", error);
  }
};
