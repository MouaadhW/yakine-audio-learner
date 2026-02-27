/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';
import './src/lib/i18n';

// Register react-native-track-player playback service (dev builds only)
try {
  const TrackPlayer = require('react-native-track-player').default;
  const playbackService = require('./src/lib/audio/playbackService').default;
  TrackPlayer.registerPlaybackService(() => playbackService);
} catch {
  // Expected in Expo Go — native TrackPlayer module unavailable
}

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('main', () => App);
