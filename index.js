/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('main', () => App);

try {
	const TrackPlayer = require('react-native-track-player').default;
	const playbackService = require('./src/lib/audio/playbackService').default;

	TrackPlayer.registerPlaybackService(() => playbackService);
} catch (error) {
	console.log('TrackPlayer service not registered in this runtime');
}
