let storage: Record<string, { username: string; password: string }> = {};

export const ACCESS_CONTROL = {
  BIOMETRY_ANY: 'BIOMETRY_ANY',
};

export const ACCESSIBLE = {
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
};

export const AUTHENTICATION_TYPE = {
  BIOMETRICS: 'BIOMETRICS',
};

export interface SetOptions {
  service?: string;
  accessControl?: any;
  accessible?: any;
}

export interface Options {
  service?: string;
}

export const setGenericPassword = async (
  username: string,
  password: string,
  options?: SetOptions
): Promise<{ service: string } | false> => {
  const service = options?.service || 'default_service';
  storage[service] = { username, password };
  return { service };
};

export const getGenericPassword = async (
  options?: Options
): Promise<{ username: string; password: string; service: string } | false> => {
  const service = options?.service || 'default_service';
  const entry = storage[service];
  if (entry) {
    return { username: entry.username, password: entry.password, service };
  }
  return false;
};

export const resetGenericPassword = async (options?: Options): Promise<boolean> => {
  const service = options?.service || 'default_service';
  delete storage[service];
  return true;
};

export const __resetMockStorage = () => {
  storage = {};
};

export default {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  setGenericPassword,
  getGenericPassword,
  resetGenericPassword,
  __resetMockStorage,
};
