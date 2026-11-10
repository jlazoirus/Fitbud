const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Este repo mantiene instalaciones npm independientes, sin workspaces.
// Metro debe poder resolver los archivos de dominio fuera de native/.
config.watchFolders = [...new Set([...config.watchFolders, path.resolve(__dirname, '..')])];

module.exports = config;
