import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

export function isRTL() {
  return I18nManager.isRTL;
}

export function dirRow() {
  return I18nManager.isRTL ? 'row-reverse' : 'row';
}

export function textAlign(startOrCenterOrEnd: 'left' | 'center' | 'right') {
  if (startOrCenterOrEnd === 'center') return 'center';
  if (I18nManager.isRTL) return startOrCenterOrEnd === 'left' ? 'right' : 'left';
  return startOrCenterOrEnd;
}

export async function applyRTLForLanguage(language: string) {
  const wantRTL = language === 'ar';
  if (I18nManager.isRTL === wantRTL) return;
  try {
    I18nManager.forceRTL(wantRTL);
    // Some native layout changes require app reload — attempt expo updates reload when available
    if (Updates && typeof Updates.reloadAsync === 'function') {
      await Updates.reloadAsync();
    }
  } catch (e) {
    // fallback: log and continue — caller will need to prompt user to restart
    // eslint-disable-next-line no-console
    console.warn('Failed to apply RTL layout programmatically', e);
  }
}

export default { isRTL, dirRow, textAlign, applyRTLForLanguage };
