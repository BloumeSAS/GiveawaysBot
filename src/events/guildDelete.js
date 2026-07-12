/**
 * Handles guildDelete events.
 * Fired when the bot leaves a server, gets kicked, or the server is deleted.
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Guild | object} guild The guild object or raw event data payload
 */
module.exports = async (client, guild) => {
  try {
    if (!guild) return;

    const serverId = guild.id || guild.serverPublicId;
    const serverName = guild.name || "Inconnu";

    console.log(`========================================`);
    console.log(`📤 [GuildLeave] Le bot a quitté ou a été retiré d'un serveur.`);
    console.log(`🆔 ID du Serveur : ${serverId}`);
    console.log(`👤 Nom du Serveur : ${serverName}`);
    console.log(`ℹ️ [GuildLeave] Configuration conservée dans le dossier /data/.`);
    console.log(`========================================`);
  } catch (error) {
    console.error("[GuildLeave Error] Erreur lors de la gestion du départ du bot :", error);
  }
};
