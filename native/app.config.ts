import type { ConfigContext, ExpoConfig } from 'expo/config';

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  const projectId = process.env.EAS_PROJECT_ID;

  if (process.env.EAS_BUILD === 'true' && !projectId) {
    throw new Error('Configura EAS_PROJECT_ID antes de generar un build en EAS.');
  }

  return {
    ...config,
    name: 'Evolv',
    slug: 'evolv',
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
    },
    web: { bundler: 'metro', output: 'single', favicon: './assets/evolv.png' },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        { backgroundColor: '#101010', image: './assets/evolv.png', imageWidth: 120 },
      ],
    ],
    runtimeVersion: { policy: 'fingerprint' },
    updates: {
      enabled: Boolean(projectId),
      ...(projectId ? { url: `https://u.expo.dev/${projectId}` } : {}),
    },
    extra: {
      ...(projectId ? { eas: { projectId } } : {}),
    },
  };
}
