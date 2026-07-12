const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
const legacyRootPath = path.join(__dirname, '..', '..', 'giveaways.json');
const legacyDataPath = path.join(dataDir, 'giveaways.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (error) {
    console.error("[GiveawayDb] Impossible de créer le dossier data/ :", error);
  }
}

/**
 * Migrates giveaways from central giveaways.json files to server-specific files
 */
function migrateLegacyGiveaways() {
  let legacyPath = null;
  if (fs.existsSync(legacyDataPath)) {
    legacyPath = legacyDataPath;
  } else if (fs.existsSync(legacyRootPath)) {
    legacyPath = legacyRootPath;
  }

  if (legacyPath) {
    try {
      console.log(`[GiveawayDb] Fichier de giveaways legacy détecté : ${legacyPath}. Migration en cours...`);
      const raw = fs.readFileSync(legacyPath, 'utf8');
      const giveaways = JSON.parse(raw);
      if (Array.isArray(giveaways)) {
        const groups = {};
        for (const g of giveaways) {
          if (g.serverId) {
            if (!groups[g.serverId]) {
              groups[g.serverId] = [];
            }
            groups[g.serverId].push(g);
          }
        }

        for (const serverId of Object.keys(groups)) {
          const serverPath = path.join(dataDir, `${serverId}.json`);
          let config = {};
          if (fs.existsSync(serverPath)) {
            try {
              const content = fs.readFileSync(serverPath, 'utf8');
              config = JSON.parse(content);
            } catch (e) {
              console.error(`Error reading config during migration for server ${serverId}:`, e);
            }
          }
          
          if (!Array.isArray(config.giveaways)) {
            config.giveaways = [];
          }
          
          for (const newG of groups[serverId]) {
            if (!config.giveaways.some(existingG => existingG.messageId === newG.messageId)) {
              config.giveaways.push(newG);
            }
          }

          fs.writeFileSync(serverPath, JSON.stringify(config, null, 2), 'utf8');
          console.log(`[GiveawayDb] ${groups[serverId].length} concours migrés vers data/${serverId}.json`);
        }
      }
      
      fs.unlinkSync(legacyPath);
      console.log(`[GiveawayDb] Migration des concours terminée et fichier legacy ${path.basename(legacyPath)} supprimé.`);
    } catch (error) {
      console.error("[GiveawayDb] Erreur lors de la migration des concours :", error);
    }
  }
}

// Run migration
migrateLegacyGiveaways();

/**
 * Loads all giveaways for a specific server, or all servers combined
 * @param {string} [serverId] The ID of the server to fetch giveaways for
 * @returns {Array}
 */
function getGiveaways(serverId = null) {
  if (serverId) {
    const serverPath = path.join(dataDir, `${serverId}.json`);
    try {
      if (fs.existsSync(serverPath)) {
        const content = fs.readFileSync(serverPath, 'utf8');
        const config = JSON.parse(content);
        if (config && Array.isArray(config.giveaways)) {
          return config.giveaways;
        }
      }
    } catch (error) {
      console.error(`Error reading giveaways for server ${serverId}:`, error);
    }
    return [];
  } else {
    const allGiveaways = [];
    try {
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'default.json' && f !== 'giveaways.json');
        for (const file of files) {
          const filePath = path.join(dataDir, file);
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const config = JSON.parse(content);
            if (config && Array.isArray(config.giveaways)) {
              allGiveaways.push(...config.giveaways);
            }
          } catch (e) {
            console.error(`Error reading file ${file} in getGiveaways:`, e);
          }
        }
      }
    } catch (error) {
      console.error("Error scanning dataDir for giveaways:", error);
    }
    return allGiveaways;
  }
}

/**
 * Saves giveaways array to a server-specific config file
 * @param {string} serverId The ID of the server
 * @param {Array} data The giveaways array for this server
 */
function saveGiveaways(serverId, data) {
  if (!serverId) return;
  const serverPath = path.join(dataDir, `${serverId}.json`);
  let config = {};
  try {
    if (fs.existsSync(serverPath)) {
      const content = fs.readFileSync(serverPath, 'utf8');
      config = JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error reading config for write ${serverId}:`, error);
  }

  config.giveaways = data;

  try {
    fs.writeFileSync(serverPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing giveaways file for ${serverId}:`, error);
  }
}

/**
 * Adds a new giveaway to persistent storage
 * @param {object} giveaway 
 */
function addGiveaway(giveaway) {
  const serverId = giveaway.serverId;
  const current = getGiveaways(serverId);
  current.push(giveaway);
  saveGiveaways(serverId, current);
}

/**
 * Updates an existing giveaway's fields in persistent storage
 * @param {string} messageId 
 * @param {object} updates 
 */
function updateGiveaway(messageId, updates) {
  const all = getGiveaways();
  const target = all.find(g => g.messageId === messageId);
  if (!target) return;

  const serverId = target.serverId;
  const current = getGiveaways(serverId);
  const index = current.findIndex(g => g.messageId === messageId);
  if (index !== -1) {
    current[index] = { ...current[index], ...updates };
    saveGiveaways(serverId, current);
  }
}

module.exports = {
  getGiveaways,
  saveGiveaways,
  addGiveaway,
  updateGiveaway
};
