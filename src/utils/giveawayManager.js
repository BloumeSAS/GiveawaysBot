const { Message, User, Channel } = require('bloumechat');
const { createEmbed } = require('./embed');
const {
  getGiveaways,
  addGiveaway,
  updateGiveaway
} = require('./giveawayDb');

// Map to store active setTimeout references by messageId
const activeTimers = new Map();

/**
 * Safely fetches a channel from cache, guild categories fetch, or skeleton instantiation.
 * @param {import('bloumechat').BloumeChat} client 
 * @param {string} channelId 
 * @param {string} serverId 
 * @returns {Promise<import('bloumechat').Channel>}
 */
async function safelyFetchChannel(client, channelId, serverId) {
  let channel = client.channels.cache.get(channelId);
  if (channel) return channel;

  if (serverId) {
    try {
      const guildChannels = await client.channels.fetchForGuild(serverId);
      channel = guildChannels.find(c => c.id === channelId);
      if (channel) return channel;
    } catch (err) {
      console.warn(`[GiveawayManager] Impossible de fetchForGuild pour le serveur ${serverId}:`, err.message);
    }
  }

  console.log(`[GiveawayManager] Salon ${channelId} introuvable en cache/serveur, instanciation manuelle.`);
  return new Channel(client, {
    publicId: channelId,
    name: "giveaway-channel",
    type: "TEXT",
    serverPublicId: serverId
  });
}

/**
 * Safely retrieves the server name from cache or by fetching all guilds
 * @param {import('bloumechat').BloumeChat} client
 * @param {string} serverId
 * @returns {Promise<string>}
 */
async function safelyGetServerName(client, serverId) {
  let guild = client.guilds.cache.get(serverId);
  if (!guild) {
    try {
      const guilds = await client.guilds.fetchAll();
      guild = guilds.find(g => g.id === serverId);
    } catch (err) {
      console.warn(`[GiveawayManager] Impossible de fetchAll les serveurs:`, err.message);
    }
  }
  return guild ? guild.name : "";
}

/**
 * Fetches the Message object for a giveaway.
 * @param {import('bloumechat').BloumeChat} client 
 * @param {string} channelId 
 * @param {string} serverId 
 * @param {string} messageId 
 * @returns {Promise<import('bloumechat').Message>}
 */
async function fetchGiveawayMessage(client, channelId, serverId, messageId) {
  try {
    const channel = await safelyFetchChannel(client, channelId, serverId);
    if (channel) {
      try {
        const messages = await channel.fetchMessages(100);
        const msg = messages.find(m => m.id === messageId);
        if (msg) return msg;
      } catch (err) {
        console.warn(`[GiveawayManager] Impossible de lister les messages du salon ${channelId}:`, err.message);
      }
    }
  } catch (error) {
    console.warn(`[GiveawayManager] Impossible de récupérer le message via le salon ${channelId}:`, error.message);
  }

  console.log(`[GiveawayManager] Message ${messageId} introuvable en cache, instanciation manuelle.`);
  return new Message(client, {
    publicId: messageId,
    channelPublicId: channelId,
    serverPublicId: serverId,
    content: "",
    author: { publicId: client.user.id },
    createdAt: new Date().toISOString(),
    embeds: []
  });
}

/**
 * Ends a giveaway, draws winners, edits the embed, announces in the channel, and sends DMs.
 * Resilient to offline states, high latency, and network lags.
 * @param {import('bloumechat').BloumeChat} client 
 * @param {string} messageId 
 * @param {boolean} [force=false] Force immediate end, ignoring timer checks
 */
async function endGiveaway(client, messageId, force = false) {
  if (activeTimers.has(messageId)) {
    clearTimeout(activeTimers.get(messageId));
    activeTimers.delete(messageId);
  }

  const current = getGiveaways();
  const giveaway = current.find(g => g.messageId === messageId);
  if (!giveaway) {
    console.error(`[GiveawayManager] Concours non trouvé pour l'ID : ${messageId}`);
    return;
  }

  if (giveaway.status !== 'active' && !force) {
    console.log(`[GiveawayManager] Le concours ${messageId} est déjà terminé.`);
    return;
  }

  try {
    // Attempt to fetch the giveaway message
    const message = await fetchGiveawayMessage(client, giveaway.channelId, giveaway.serverId, messageId);

    // Fetch reactions (participants)
    let reactions;
    try {
      reactions = await message.fetchReactions('🎉');
    } catch (err) {
      console.error(`[GiveawayManager] Latence/Réseau - Impossible de récupérer les réactions pour ${messageId}. Re-tentative programmée dans 30s.`, err.message);
      const retryTimer = setTimeout(() => {
        endGiveaway(client, messageId, force);
      }, 30000);
      activeTimers.set(messageId, retryTimer);
      return;
    }

    const botId = client.user ? client.user.id : null;
    const participants = reactions.filter(u => u.userPublicId !== botId);

    console.log(`[GiveawayManager] Fin du concours ${messageId}. Participants : ${participants.length}`);

    // Draw winners
    const winners = [];
    const tempParticipants = [...participants];
    const targetCount = parseInt(giveaway.winnerCount, 10) || 1;

    for (let i = 0; i < Math.min(targetCount, participants.length); i++) {
      const randomIndex = Math.floor(Math.random() * tempParticipants.length);
      winners.push(tempParticipants.splice(randomIndex, 1)[0]);
    }

    // Resolve details for winners
    const resolvedWinners = [];
    for (const winner of winners) {
      try {
        const resolvedUser = await client.users.fetch(winner.userPublicId);
        resolvedWinners.push(resolvedUser);
      } catch (err) {
        console.warn(`[GiveawayManager] Impossible de fetch l'utilisateur ${winner.userPublicId}:`, err.message);
        resolvedWinners.push({
          id: winner.userPublicId,
          username: winner.userName,
          tag: '0000'
        });
      }
    }

    let winnerMentions = "Aucun gagnant (pas de participants valides)";
    if (resolvedWinners.length > 0) {
      winnerMentions = resolvedWinners.map(w => `@${w.username}#${w.tag}`).join(', ');
    }

    // Edit embed
    const originalEmbed = createEmbed(
      `🎉 Giveaway Terminé 🎉`,
      `Le concours est terminé !\n\n**Lot :** ${giveaway.prize}\n**Gagnant(s) :** ${winnerMentions}`,
      giveaway.serverId
    );

    try {
      await message.edit(originalEmbed);
    } catch (err) {
      console.warn(`[GiveawayManager] Erreur soft lors de l'édition de l'embed :`, err.message);
    }

    // Announce in channel
    const channel = await safelyFetchChannel(client, giveaway.channelId, giveaway.serverId);
    if (channel) {
      try {
        if (resolvedWinners.length > 0) {
          await channel.send(`🎉 Félicitations à ${winnerMentions} ! Vous avez gagné **${giveaway.prize}** ! 🎁`);
        } else {
          await channel.send(`😢 Le concours pour **${giveaway.prize}** est terminé, mais aucun gagnant n'a pu être tiré au sort (pas de participants valides).`);
        }
      } catch (err) {
        console.error(`[GiveawayManager] Impossible d'envoyer le message de fin dans le salon :`, err.message);
      }
    }

    // Send DMs to winners
    const serverName = await safelyGetServerName(client, giveaway.serverId);
    const serverSuffix = serverName ? ` sur le serveur **${serverName}**` : "";
    for (const winner of resolvedWinners) {
      try {
        const dm = await client.createDM(winner.id);
        await dm.send(`🎉 Félicitations ! Tu as gagné le giveaway pour **${giveaway.prize}**${serverSuffix} ! 🎁`);
      } catch (dmErr) {
        console.error(`[GiveawayManager] Impossible d'envoyer un DM au gagnant ${winner.username}:`, dmErr.message);
      }
    }

    // Mark as ended in database ONLY after successful draw & announcement!
    updateGiveaway(messageId, { status: 'ended', winners: resolvedWinners.map(w => w.id) });

  } catch (error) {
    console.error(`[GiveawayManager] Erreur critique lors de la fin du concours ${messageId}. Re-tentative programmée dans 30s.`, error);
    const retryTimer = setTimeout(() => {
      endGiveaway(client, messageId, force);
    }, 30000);
    activeTimers.set(messageId, retryTimer);
  }
}

/**
 * Draws new winners for an ended giveaway
 * @param {import('bloumechat').BloumeChat} client 
 * @param {string} messageId 
 * @returns {Promise<boolean>} Success status
 */
async function rerollGiveaway(client, messageId) {
  const current = getGiveaways();
  const giveaway = current.find(g => g.messageId === messageId);
  if (!giveaway || giveaway.status !== 'ended') {
    return false;
  }

  try {
    const message = await fetchGiveawayMessage(client, giveaway.channelId, giveaway.serverId, messageId);
    
    let reactions;
    try {
      reactions = await message.fetchReactions('🎉');
    } catch (err) {
      console.error(`[GiveawayManager] Reroll: Impossible de fetch les réactions 🎉:`, err.message);
      return false;
    }

    const botId = client.user ? client.user.id : null;
    const participants = reactions.filter(u => u.userPublicId !== botId);

    const channel = await safelyFetchChannel(client, giveaway.channelId, giveaway.serverId);
    if (participants.length === 0) {
      if (channel) {
        await channel.send(`😢 Reroll impossible pour **${giveaway.prize}** : aucun participant valide n'a réagi.`);
      }
      return true;
    }

    const winners = [];
    const tempParticipants = [...participants];
    const targetCount = parseInt(giveaway.winnerCount, 10) || 1;

    for (let i = 0; i < Math.min(targetCount, participants.length); i++) {
      const randomIndex = Math.floor(Math.random() * tempParticipants.length);
      winners.push(tempParticipants.splice(randomIndex, 1)[0]);
    }

    const resolvedWinners = [];
    for (const winner of winners) {
      try {
        const resolvedUser = await client.users.fetch(winner.userPublicId);
        resolvedWinners.push(resolvedUser);
      } catch (err) {
        console.warn(`[GiveawayManager] Reroll: Impossible de fetch l'utilisateur ${winner.userPublicId}:`, err.message);
        resolvedWinners.push({
          id: winner.userPublicId,
          username: winner.userName,
          tag: '0000'
        });
      }
    }

    const winnerMentions = resolvedWinners.map(w => `@${w.username}#${w.tag}`).join(', ');

    const originalEmbed = createEmbed(
      `🎉 Giveaway Terminé (Reroll) 🎉`,
      `Le concours a été relancé !\n\n**Lot :** ${giveaway.prize}\n**Nouveau(x) gagnant(s) :** ${winnerMentions}`,
      giveaway.serverId
    );
    
    try {
      await message.edit(originalEmbed);
    } catch (err) {}

    if (channel) {
      try {
        await channel.send(`🎉 **Nouveau Tirage !** Félicitations à ${winnerMentions} ! Vous avez gagné **${giveaway.prize}** ! 🎁`);
      } catch (e) {}
    }

    const serverName = await safelyGetServerName(client, giveaway.serverId);
    const serverSuffix = serverName ? ` sur le serveur **${serverName}**` : "";
    for (const winner of resolvedWinners) {
      try {
        const dm = await client.createDM(winner.id);
        await dm.send(`🎉 Félicitations (Reroll) ! Tu as gagné le giveaway pour **${giveaway.prize}**${serverSuffix} ! 🎁`);
      } catch (dmErr) {
        console.error(`[GiveawayManager] Reroll: Impossible de contacter ${winner.username}:`, dmErr.message);
      }
    }

    updateGiveaway(messageId, { winners: resolvedWinners.map(w => w.id) });
    return true;
  } catch (error) {
    console.error(`[GiveawayManager] Erreur lors du reroll pour le message ${messageId}:`, error);
    return false;
  }
}

/**
 * Schedules the end of a giveaway.
 * If the scheduled end time is in the past, ends it immediately.
 * @param {import('bloumechat').BloumeChat} client 
 * @param {object} giveaway 
 */
function scheduleGiveaway(client, giveaway) {
  const endAt = giveaway.endAt;
  const remaining = endAt - Date.now();

  if (activeTimers.has(giveaway.messageId)) {
    clearTimeout(activeTimers.get(giveaway.messageId));
    activeTimers.delete(giveaway.messageId);
  }

  if (remaining <= 0) {
    console.log(`[GiveawayManager] Le temps est déjà écoulé pour ${giveaway.messageId}. Résolution immédiate.`);
    endGiveaway(client, giveaway.messageId);
  } else {
    console.log(`[GiveawayManager] Programmation du giveaway ${giveaway.messageId} dans ${Math.round(remaining / 1000)}s.`);
    const timer = setTimeout(() => {
      endGiveaway(client, giveaway.messageId);
    }, remaining);
    activeTimers.set(giveaway.messageId, timer);
  }
}

module.exports = {
  getGiveaways,
  addGiveaway,
  updateGiveaway,
  endGiveaway,
  rerollGiveaway,
  scheduleGiveaway
};
