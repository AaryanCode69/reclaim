import { TransformRequestManager } from '@maplibre/maplibre-react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// The Location API key is restricted to this Android app (AllowAndroidApps).
// Amazon Location only serves tiles when these two headers match the key's
// package name and signing-cert SHA-1, so MapLibre must send them.
const LOCATION_MAPS_HOST = /^https:\/\/maps\.geo\.[a-z0-9-]+\.amazonaws\.com\//;

let configured = false;

export function configureMapRequests(): void {
  if (configured || Platform.OS !== 'android') return;
  const androidPackage = Constants.expoConfig?.android?.package;
  const certSha1 = process.env.EXPO_PUBLIC_ANDROID_CERT_SHA1;
  if (!androidPackage || !certSha1) return;

  TransformRequestManager.addHeader({
    id: 'x-android-package',
    name: 'X-Android-Package',
    value: androidPackage,
    match: LOCATION_MAPS_HOST,
  });
  TransformRequestManager.addHeader({
    id: 'x-android-cert',
    name: 'X-Android-Cert',
    value: certSha1,
    match: LOCATION_MAPS_HOST,
  });
  configured = true;
}
