const path = require("path");

module.exports = {
  // served at beta.dearcrisis.com/meeting/ by beta's Worker (2026-11-18), so every file and route lives under it
  publicPath: "/meeting/",
  pluginOptions: {
    moment: {
      locales: [""],
    },
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000'
      }
    }
  },
  outputDir: path.resolve(__dirname, '../backend/public')
};
