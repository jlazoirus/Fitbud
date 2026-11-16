import type { ConfigContext, ExpoConfig } from 'expo/config';

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  // Identificadores públicos del proyecto creado y verificado en Expo (NAT-29).
  const projectId = (process.env.EAS_PROJECT_ID ?? '8ca822d7-81ed-4428-969d-bbcd1f586b0b').trim();
  const owner = (process.env.EXPO_OWNER ?? 'jlazo').trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
    throw new Error('EAS_PROJECT_ID debe ser el UUID público del proyecto de Expo.');
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(owner)) {
    throw new Error('EXPO_OWNER debe ser el nombre de la cuenta o equipo de Expo.');
  }

  return {
    ...config,
    name: 'Evolv',
    slug: 'evolv',
    owner,
    version: '0.1.0',
    scheme: 'evolv',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    backgroundColor: '#101010',
    icon: './assets/evolv.png',
    platforms: ['ios', 'android', 'web'],
    ios: {
      bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || 'club.evolvapp.app',
      supportsTablet: true,
      buildNumber: '1',
    },
    android: {
      package: process.env.ANDROID_PACKAGE_NAME || 'club.evolvapp.app',
      versionCode: 1,
      // NAT-73: instaladas pero aún sin uso. Cada feature habilita solo lo que necesita.
      blockedPermissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_MEDIA_AUDIO',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
        'android.permission.USE_BIOMETRIC',
        'android.permission.USE_FINGERPRINT',
      ],
    },
    web: { bundler: 'metro', output: 'single', favicon: './assets/evolv.png' },
    plugins: [
      'expo-router',
      ['expo-sqlite', { useSQLCipher: true }],
      ['expo-secure-store', { faceIDPermission: false }],
      'expo-image',
      'expo-sharing',
      'expo-web-browser',
      'expo-localization',
      [
        'expo-image-picker',
        { photosPermission: false, cameraPermission: false, microphonePermission: false },
      ],
      [
        'expo-splash-screen',
        { backgroundColor: '#101010', image: './assets/evolv.png', imageWidth: 120 },
      ],
    ],
    runtimeVersion: { policy: 'fingerprint' },
    updates: {
      enabled: true,
      url: `https://u.expo.dev/${projectId}`,
    },
    extra: {
      eas: { projectId },
    },
  };
}
