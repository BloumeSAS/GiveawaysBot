const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (error) {
    console.error("[SettingsManager] Impossible de créer le dossier data/ :", error);
  }
}

// Default fallback settings
const defaultSettings = {
  footer: "Giveaways Bot • Fait avec ❤️",
  themeColor: "#bd5fff",
  adminPermission: "none",
  giveawayChannel: null
};

// Automatic migration from root settings.json to data/ directory
const legacySettingsPath = path.join(__dirname, '..', '..', 'settings.json');
if (fs.existsSync(legacySettingsPath)) {
  try {
    console.log("[SettingsManager] Fichier de configuration legacy détecté. Début de la migration...");
    const rawData = fs.readFileSync(legacySettingsPath, 'utf8');
    const allSettings = JSON.parse(rawData);

    for (const key of Object.keys(allSettings)) {
      const serverPath = path.join(dataDir, `${key}.json`);
      if (!fs.existsSync(serverPath)) {
        fs.writeFileSync(serverPath, JSON.stringify(allSettings[key], null, 2), 'utf8');
      }
    }

    // Delete legacy file
    fs.unlinkSync(legacySettingsPath);
    console.log("[SettingsManager] Migration réussie ! Le fichier settings.json a été supprimé.");
  } catch (error) {
    console.error("[SettingsManager] Erreur lors de la migration de settings.json :", error);
  }
}

/**
 * Loads the settings from data/<serverId>.json or returns default settings.
 * @param {string} [serverId] The ID of the server
 * @returns {object} The settings for the server, merged with defaults
 */
function getSettings(serverId = null) {
  // Always resolve defaults first
  const defaultPath = path.join(dataDir, 'default.json');
  let def = { ...defaultSettings };
  try {
    if (fs.existsSync(defaultPath)) {
      const data = fs.readFileSync(defaultPath, 'utf8');
      def = { ...def, ...JSON.parse(data) };
    } else {
      // Write default.json initially if not present
      fs.writeFileSync(defaultPath, JSON.stringify(def, null, 2), 'utf8');
    }
  } catch (error) {
    console.error("Error reading default settings:", error);
  }

  if (!serverId || serverId === 'default') {
    return def;
  }

  // Load server-specific settings
  const serverPath = path.join(dataDir, `${serverId}.json`);
  let serverSettings = {};
  try {
    if (fs.existsSync(serverPath)) {
      const data = fs.readFileSync(serverPath, 'utf8');
      serverSettings = JSON.parse(data);
    } else {
      // Automatically create the setting file for the new server
      fs.writeFileSync(serverPath, JSON.stringify({}, null, 2), 'utf8');
      console.log(`[SettingsManager] Fichier de configuration créé pour le serveur : ${serverId}`);
    }
  } catch (error) {
    console.error(`Error reading/creating settings for server ${serverId}:`, error);
  }

  return { ...def, ...serverSettings };
}

/**
 * Updates a setting key with a value and saves it under data/<serverId>.json.
 * @param {string} serverId The ID of the server to update settings for
 * @param {string} key 
 * @param {any} value 
 * @returns {object} updated settings for that server
 */
function updateSetting(serverId, key, value) {
  if (!serverId) {
    serverId = 'default';
  }

  const targetPath = path.join(dataDir, `${serverId}.json`);
  let settings = {};
  try {
    if (fs.existsSync(targetPath)) {
      const data = fs.readFileSync(targetPath, 'utf8');
      settings = JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading settings file for write ${serverId}:`, error);
  }

  settings[key] = value;

  try {
    fs.writeFileSync(targetPath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing settings file ${serverId}:`, error);
  }

  return getSettings(serverId);
}

module.exports = {
  getSettings,
  updateSetting
};
