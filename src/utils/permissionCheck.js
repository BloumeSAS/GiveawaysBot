const { PermissionFlags } = require('bloumechat');
const { getSettings } = require('./settingsManager');

const permissionMap = {
  'ADMINISTRATOR': PermissionFlags.ADMINISTRATOR,
  'MANAGE_SERVER': PermissionFlags.MANAGE_SERVER,
  'MANAGE_ROLES': PermissionFlags.MANAGE_ROLES,
  'MANAGE_CHANNELS': PermissionFlags.MANAGE_CHANNELS,
  'MANAGE_MESSAGES': PermissionFlags.MANAGE_MESSAGES,
  'KICK_MEMBERS': PermissionFlags.KICK_MEMBERS,
  'BAN_MEMBERS': PermissionFlags.BAN_MEMBERS,
  'VIEW_CHANNELS': PermissionFlags.VIEW_CHANNELS,
  'SEND_MESSAGES': PermissionFlags.SEND_MESSAGES
};

/**
 * Checks if the member who sent the message has permission to execute admin commands.
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Message} message 
 * @returns {Promise<boolean>}
 */
async function hasAdminAccess(client, message) {
  // If not in a server (DMs), block admin commands
  if (!message.serverId) {
    return false;
  }

  // Fetch guild and member
  const guild = client.guilds.cache.get(message.serverId);
  if (!guild) return false;

  // Guild owner always has access
  if (guild.ownerId === message.author.id) {
    return true;
  }

  try {
    const member = await client.members.fetch(message.serverId, message.author.id);
    if (!member) return false;

    // Administrator permission always bypasses all checks
    if (member.hasPermission(PermissionFlags.ADMINISTRATOR)) {
      return true;
    }

    const settings = getSettings(message.serverId);

    // Check Permission if configured
    if (settings.adminPermission && settings.adminPermission !== 'none') {
      const requiredFlag = permissionMap[settings.adminPermission.toUpperCase()];
      if (requiredFlag && member.hasPermission(requiredFlag)) {
        return true;
      }
    }

    // Default fallback: if no custom permission is configured, require MANAGE_SERVER
    if (!settings.adminPermission || settings.adminPermission === 'none') {
      return member.hasPermission(PermissionFlags.MANAGE_SERVER);
    }

  } catch (error) {
    console.error("Error fetching member or checking permissions:", error);
  }

  return false;
}

module.exports = {
  hasAdminAccess,
  permissionMap
};
