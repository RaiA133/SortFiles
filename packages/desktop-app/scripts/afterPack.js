/**
 * After pack script for electron-builder
 * Run custom operations after packaging
 */

exports.default = async function (context) {
  const { electronPlatformName, appOutDir } = context;

  console.log(`After pack: ${electronPlatformName} -> ${appOutDir}`);

  // Add any post-pack operations here
  // For example: copying extra files, creating shortcuts, etc.
};
