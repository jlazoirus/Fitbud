import type { ConfigContext } from 'expo/config';
import appConfig from '../app.config';

const context = {
  config: {},
  projectRoot: '.',
  staticConfigPath: null,
  packageJsonPath: '',
} as ConfigContext;

describe('Configuración de builds y actualizaciones', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EAS_PROJECT_ID;
    delete process.env.EXPO_OWNER;
    delete process.env.EAS_BUILD;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('vincula por defecto el mismo proyecto verificado en el panel de Expo', () => {
    const config = appConfig(context);
    expect(config.owner).toBe('jlazo');
    expect(config.slug).toBe('evolv');
    expect(config.updates?.enabled).toBe(true);
    expect(config.updates?.url).toBe('https://u.expo.dev/8ca822d7-81ed-4428-969d-bbcd1f586b0b');
    expect(config.extra?.eas.projectId).toBe('8ca822d7-81ed-4428-969d-bbcd1f586b0b');
  });

  it('permite generar en EAS con la vinculación pública del repositorio', () => {
    process.env.EAS_BUILD = 'true';
    expect(appConfig(context).extra?.eas.projectId).toBe('8ca822d7-81ed-4428-969d-bbcd1f586b0b');
  });

  it('vincula los OTA al proyecto y a la huella del runtime del binario', () => {
    process.env.EAS_PROJECT_ID = '11111111-1111-4111-8111-111111111111';
    process.env.EXPO_OWNER = 'evolv-qa';
    process.env.EAS_BUILD = 'true';
    const config = appConfig(context);
    expect(config.updates?.enabled).toBe(true);
    expect(config.updates?.url).toBe(`https://u.expo.dev/${process.env.EAS_PROJECT_ID}`);
    expect(config.extra?.eas.projectId).toBe(process.env.EAS_PROJECT_ID);
    expect(config.runtimeVersion).toEqual({ policy: 'fingerprint' });
    expect(config.owner).toBe('evolv-qa');
  });

  it('compila SQLCipher en ambas plataformas sin activar biometría ni textos de captura', () => {
    const config = appConfig(context);
    expect(config.plugins).toContainEqual(['expo-sqlite', { useSQLCipher: true }]);
    expect(config.plugins).toContainEqual(['expo-secure-store', { faceIDPermission: false }]);
    expect(config.plugins).toContainEqual([
      'expo-image-picker',
      { photosPermission: false, cameraPermission: false, microphonePermission: false },
    ]);
    expect(config.ios?.infoPlist).toBeUndefined();
    expect(config.android?.permissions).toBeUndefined();
  });

  it.each([
    'CAMERA',
    'RECORD_AUDIO',
    'READ_EXTERNAL_STORAGE',
    'WRITE_EXTERNAL_STORAGE',
    'READ_MEDIA_IMAGES',
    'READ_MEDIA_VIDEO',
    'READ_MEDIA_AUDIO',
    'POST_NOTIFICATIONS',
    'RECEIVE_BOOT_COMPLETED',
    'VIBRATE',
    'USE_BIOMETRIC',
    'USE_FINGERPRINT',
  ])('bloquea el permiso %s hasta la tarea que lo use', (permission) => {
    expect(appConfig(context).android?.blockedPermissions).toContain(
      `android.permission.${permission}`,
    );
  });

  it.each(['', ' ', 'not-a-project-id', 'https://expo.dev/accounts/jlazo'])(
    'rechaza un projectId inválido (%s) antes de generar un binario',
    (projectId) => {
      process.env.EAS_PROJECT_ID = projectId;
      expect(() => appConfig(context)).toThrow('EAS_PROJECT_ID');
    },
  );

  it('rechaza un owner vacío o con formato de URL', () => {
    process.env.EXPO_OWNER = '';
    expect(() => appConfig(context)).toThrow('EXPO_OWNER');
    process.env.EXPO_OWNER = 'https://expo.dev/accounts/jlazo';
    expect(() => appConfig(context)).toThrow('EXPO_OWNER');
  });
});
