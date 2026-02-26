#!/usr/bin/env node
/**
 * Patches native modules that crash in Expo Go by calling
 * `new NativeEventEmitter(null)`.
 *
 * Run automatically via "postinstall" in package.json.
 */
const fs = require('fs');
const path = require('path');

const patches = [
  {
    file: path.resolve(
      __dirname,
      '../node_modules/react-native-track-player/lib/src/trackPlayer.js',
    ),
    find: "? new NativeEventEmitter(TrackPlayer)",
    replace:
      "? (TrackPlayer != null ? new NativeEventEmitter(TrackPlayer) : DeviceEventEmitter)",
  },
  {
    file: path.resolve(
      __dirname,
      '../node_modules/react-native-track-player/src/trackPlayer.ts',
    ),
    find: "? new NativeEventEmitter(TrackPlayer)",
    replace:
      "? (TrackPlayer != null ? new NativeEventEmitter(TrackPlayer) : DeviceEventEmitter)",
  },
  {
    file: path.resolve(
      __dirname,
      '../node_modules/react-native-fs/FS.common.js',
    ),
    find: "var RNFS_NativeEventEmitter = new NativeEventEmitter(RNFSManager);",
    replace:
      "var RNFS_NativeEventEmitter = RNFSManager != null ? new NativeEventEmitter(RNFSManager) : null;",
  },
];

let applied = 0;
for (const patch of patches) {
  if (!fs.existsSync(patch.file)) continue;
  let content = fs.readFileSync(patch.file, 'utf8');
  if (content.includes(patch.find)) {
    content = content.replace(patch.find, patch.replace);
    fs.writeFileSync(patch.file, content, 'utf8');
    applied++;
    console.log(`  ✔ Patched ${path.relative(process.cwd(), patch.file)}`);
  }
}

if (applied > 0) {
  console.log(`patch-native-modules: ${applied} patch(es) applied.`);
} else {
  console.log('patch-native-modules: all patches already applied.');
}
