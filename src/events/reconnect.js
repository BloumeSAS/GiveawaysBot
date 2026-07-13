/**
 * Handles reconnect events.
 * Fired when the bot successfully reconnects to BloumeChat.
 * @param {import('bloumechat').BloumeChat} client 
 */
module.exports = async (client) => {
  try {
    console.log("🎮 Rétablissement de l'activité du bot...");
    await client.setActivity({
      type: "playing",
      name: "!help | Giveaways Bot"
    });
    console.log("🎮 Activité du bot rétablie avec succès !");
  } catch (err) {
    console.error("[Reconnect Event] Impossible de rétablir l'activité :", err);
  }
};
