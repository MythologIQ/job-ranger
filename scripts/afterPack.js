/**
 * After pack script for Electron Builder
 * This script runs after the app is packaged
 */

exports.default = async function (context) {
  const { electronPlatformName, appOutDir } = context;

  console.log(`After pack: ${electronPlatformName} -> ${appOutDir}`);

  // You can add custom logic here to modify the packaged app
  // For example, copy additional files, modify permissions, etc.
};
