/**
 * Utility module for managing bot activity status.
 */

/**
 * Updates the bot's rich presence activity to display the current server count.
 * @param {import('bloumechat').BloumeChat} client 
 */
function updateActivity(client) {
  try {
    const serverCount = client.guilds && client.guilds.cache ? client.guilds.cache.size : 0;
    const serverText = `${serverCount} serveur${serverCount > 1 ? 's' : ''}`;

    return client.setActivity({
      type: "playing",
      name: `!help | ${serverText} | Giveaways Bot`
    }).catch(err => {
      console.error("[Activity] Impossible de définir l'activité :", err);
    });
  } catch (err) {
    console.error("[Activity] Erreur lors de la mise à jour de l'activité :", err);
  }
}

module.exports = { updateActivity };
