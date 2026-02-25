/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';
import './src/lib/i18n';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('main', () => App);
