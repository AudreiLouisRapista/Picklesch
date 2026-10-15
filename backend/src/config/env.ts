export const ENV_PROFILES = ['development', 'staging', 'production', 'test'] as const;

export type EnvProfile = (typeof ENV_PROFILES)[number];

export interface AppConfig {
  env: EnvProfile;
  port: number;
  apiBaseUrl: string;
  mongoUri: string;
  sentryDsn: string | undefined;
}

export function getEnvProfile(raw: string | undefined = process.env.NODE_ENV): EnvProfile {
  const value = (raw ?? 'development') as EnvProfile;

  if (!ENV_PROFILES.includes(value)) {
    throw new Error(`Invalid NODE_ENV "${raw}". Expected one of: ${ENV_PROFILES.join(', ')}`);
  }

  return value;
}

export function loadConfig(): AppConfig {
  const env = getEnvProfile();
  const port = Number(process.env.PORT ?? 4000);

  return {
    env,
    port,
    apiBaseUrl: process.env.API_BASE_URL ?? `http://localhost:${port}`,
    mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/picklesch_dev',
    sentryDsn: process.env.SENTRY_DSN,
  };
}
