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
    delete process.env.EAS_BUILD;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('permite arrancar localmente antes de vincular la cuenta de Expo', () => {
    const config = appConfig(context);
    expect(config.updates?.enabled).toBe(false);
    expect(config.updates?.url).toBeUndefined();
    expect(config.extra?.eas).toBeUndefined();
  });

  it('impide generar en EAS un binario sin proyecto de actualizaciones', () => {
    process.env.EAS_BUILD = 'true';
    expect(() => appConfig(context)).toThrow('EAS_PROJECT_ID');
  });

  it('vincula los OTA al proyecto y a la huella del runtime del binario', () => {
    process.env.EAS_PROJECT_ID = '11111111-1111-4111-8111-111111111111';
    process.env.EAS_BUILD = 'true';
    const config = appConfig(context);
    expect(config.updates?.enabled).toBe(true);
    expect(config.updates?.url).toBe(`https://u.expo.dev/${process.env.EAS_PROJECT_ID}`);
    expect(config.extra?.eas.projectId).toBe(process.env.EAS_PROJECT_ID);
    expect(config.runtimeVersion).toEqual({ policy: 'fingerprint' });
  });
});
