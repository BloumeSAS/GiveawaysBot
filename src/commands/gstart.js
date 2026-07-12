const { createEmbed } = require('../utils/embed');
const { getSettings } = require('../utils/settingsManager');
const { addGiveaway, scheduleGiveaway } = require('../utils/giveawayManager');

module.exports = {
  name: 'gstart',
  description: 'Démarre un concours (Giveaway)',
  adminOnly: true,
  async execute(client, message, args) {
    const serverId = message.serverId;
    const settings = getSettings(serverId);

    // Check if giveaway-channel is configured and if we are in it
    if (settings.giveawayChannel && message.channelId !== settings.giveawayChannel) {
      const wrongChannelEmbed = createEmbed(
        "❌ Mauvais Salon",
        `Les concours ne peuvent être lancés que dans le salon <#${settings.giveawayChannel}>.`,
        serverId
      );
      return message.reply({ embeds: [wrongChannelEmbed] });
    }

    // Syntax validation
    if (args.length < 3) {
      const syntaxEmbed = createEmbed(
        "⚠️ Syntaxe incorrecte",
        "Veuillez utiliser la syntaxe suivante :\n`!gstart <temps> <gagnants> <lot>`\n\n**Exemples :**\n- `!gstart 10m 2 Nitro Boost` (10 minutes)\n- `!gstart 2h 1 Compte Premium` (2 heures)\n- `!gstart 1d 5 Code Promo` (1 jour)",
        serverId
      );
      return message.reply({ embeds: [syntaxEmbed] });
    }

    const timeStr = args[0];
    const winnerCountStr = args[1];
    const prize = args.slice(2).join(' ');

    // Parse time
    const timeMatch = timeStr.match(/^(\d+)([mhds])$/i);
    if (!timeMatch) {
      const invalidTimeEmbed = createEmbed(
        "⚠️ Temps invalide",
        "Le format de temps est incorrect. Utilisez `m` (minutes), `h` (heures), ou `d` (jours).\n**Exemple :** `10m`, `2h`, `1d`.",
        serverId
      );
      return message.reply({ embeds: [invalidTimeEmbed] });
    }

    const amount = parseInt(timeMatch[1], 10);
    const unit = timeMatch[2].toLowerCase();
    let durationMs = 0;

    switch (unit) {
      case 'm':
        durationMs = amount * 60 * 1000;
        break;
      case 'h':
        durationMs = amount * 60 * 60 * 1000;
        break;
      case 'd':
        durationMs = amount * 24 * 60 * 60 * 1000;
        break;
      case 's':
        durationMs = amount * 1000;
        break;
    }

    // Validate winners
    const winnerCount = parseInt(winnerCountStr, 10);
    if (isNaN(winnerCount) || winnerCount <= 0) {
      const invalidWinnersEmbed = createEmbed(
        "⚠️ Nombre de gagnants invalide",
        "Le nombre de gagnants doit être un entier supérieur à 0 (ex: `1`, `2`, `5`).",
        serverId
      );
      return message.reply({ embeds: [invalidWinnersEmbed] });
    }

    const endAt = Date.now() + durationMs;
    const endDate = new Date(endAt);

    // Format remaining time description
    let timeLabel = `${amount} minute${amount > 1 ? 's' : ''}`;
    if (unit === 'h') timeLabel = `${amount} heure${amount > 1 ? 's' : ''}`;
    if (unit === 'd') timeLabel = `${amount} jour${amount > 1 ? 's' : ''}`;
    if (unit === 's') timeLabel = `${amount} seconde${amount > 1 ? 's' : ''}`;

    // Create Giveaway Embed
    const giveawayEmbed = createEmbed(
      `🎉 CONCOURS : ${prize} 🎉`,
      `Réagissez avec 🎉 pour participer !\n\n` +
      `**Lot :** ${prize}\n` +
      `**Gagnant(s) :** ${winnerCount}\n` +
      `**Durée :** ${timeLabel}\n` +
      `**Fin :** ${endDate.toLocaleString('fr-FR')}`,
      serverId
    );

    // Send to channel
    const giveawayMsg = await message.channel.send({ embeds: [giveawayEmbed] });

    // React with emoji 🎉
    try {
      await giveawayMsg.react('🎉');
    } catch (reactErr) {
      console.error("Impossible de réagir avec 🎉 sur le message de concours :", reactErr.message);
    }

    // Save giveaway
    const giveawayData = {
      messageId: giveawayMsg.id,
      channelId: giveawayMsg.channelId,
      serverId: serverId,
      prize: prize,
      winnerCount: winnerCount,
      endAt: endAt,
      status: 'active'
    };

    addGiveaway(giveawayData);

    // Schedule the timer
    scheduleGiveaway(client, giveawayData);

    // Optional: delete command message to keep channel clean
    try {
      await message.delete();
    } catch (err) {
      // Ignore if bot doesn't have permissions
    }
  }
};
