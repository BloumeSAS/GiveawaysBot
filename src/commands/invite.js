const { createEmbed } = require('../utils/embed');

module.exports = {
  name: 'invite',
  description: "Affiche le lien d'invitation pour ajouter le bot à un autre serveur",
  adminOnly: false,
  async execute(client, message, args) {
    const serverId = message.serverId;
    const botId = process.env.CLIENT_ID || (client.user ? client.user.id : '');
    
    // Constructing the invite URL with the bot's user ID
    const inviteUrl = `https://bloumechat.com/oauth2/authorize?client_id=${botId}&scope=identify+bot&permissions=2147483648`;

    const embed = createEmbed("📥 Inviter le Giveaways Bot", null, serverId)
      .setDescription(
        `Vous souhaitez utiliser le **Giveaways Bot** sur un autre serveur ?\n\n` +
        `Cliquez sur le lien ci-dessous pour l'inviter :\n\n` +
        `➡️ **[Inviter le bot sur votre serveur](${inviteUrl})**`
      );

    await message.reply({ embeds: [embed] });
  }
};
