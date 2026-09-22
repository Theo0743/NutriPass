/**
 * STORAGE SERVICE
 * ===============
 *
 * Privacy by design:
 *   Profile -> local encrypted storage -> nutrition engine -> minimal NFC payload
 *
 * The rest of the app never touches AsyncStorage or SecureStore directly, it
 * only calls this module. Swapping the backend (SQLCipher, MMKV with an
 * encryption key, a hardware-backed keystore) means writing one new
 * `StorageAdapter` and calling `setStorageAdapter` at boot - nothing else
 * in the codebase changes.
 *
 * Default backend: expo-secure-store, which stores values in the iOS Keychain
 * and in Android EncryptedSharedPreferences (Keystore-backed). It caps values
 * at roughly 2 KB, which a single profile is far below. AsyncStorage is the
 * fallback when SecureStore is unavailable (web, simulator edge cases); it is
 * NOT encrypted, so the app reports which backend is active.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import type { ProfileDraft, UserProfile } from '../types/user';

/* -------------------------------------------------------------------------
 * Adapter contract
 * ---------------------------------------------------------------------- */

export type StorageAdapter = {
  /** Shown in the UI so the crew knows where their data sits. */
  name: string;
  /** True when the data is encrypted at rest by the OS. */
  encrypted: boolean;
  isAvailable: () => Promise<boolean>;
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export const secureStoreAdapter: StorageAdapter = {
  name: 'SecureStore (Keychain / Android Keystore)',
  encrypted: true,
  isAvailable: async () => {
    try {
      return await SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  },
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const asyncStorageAdapter: StorageAdapter = {
  name: 'AsyncStorage (unencrypted)',
  encrypted: false,
  isAvailable: async () => true,
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

let activeAdapter: StorageAdapter | null = null;

/** Replace the storage backend. Call before any read/write. */
export function setStorageAdapter(adapter: StorageAdapter): void {
  activeAdapter = adapter;
}

/** Resolves the backend once, preferring the encrypted one. */
export async function getStorageAdapter(): Promise<StorageAdapter> {
  if (activeAdapter) return activeAdapter;
  activeAdapter = (await secureStoreAdapter.isAvailable())
    ? secureStoreAdapter
    : asyncStorageAdapter;
  return activeAdapter;
}

/* -------------------------------------------------------------------------
 * Keys
 * ---------------------------------------------------------------------- */

/** Versioned keys so a future migration can read the old one and rewrite it. */
export const STORAGE_KEYS = {
  profile: 'nutripass.profile.v1',
  settings: 'nutripass.settings.v1',
} as const;

/* -------------------------------------------------------------------------
 * Profile
 * ---------------------------------------------------------------------- */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Defensive parsing: stored JSON is treated as untrusted input. A corrupted
 * or half-written record must not crash the app on launch, it must simply
 * look like "no profile yet".
 */
function parseProfile(raw: string | null): UserProfile | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    const required = ['profileId', 'firstName', 'age', 'sex', 'heightCm', 'weightKg', 'activityLevel'];
    if (required.some((field) => parsed[field] === undefined)) return null;

    return {
      profileId: String(parsed.profileId),
      firstName: String(parsed.firstName),
      age: Number(parsed.age),
      sex: parsed.sex as UserProfile['sex'],
      heightCm: Number(parsed.heightCm),
      weightKg: Number(parsed.weightKg),
      activityLevel: parsed.activityLevel as UserProfile['activityLevel'],
      leanBodyMassKg:
        parsed.leanBodyMassKg === undefined || parsed.leanBodyMassKg === null
          ? undefined
          : Number(parsed.leanBodyMassKg),
      bodyFatPercent:
        parsed.bodyFatPercent === undefined || parsed.bodyFatPercent === null
          ? undefined
          : Number(parsed.bodyFatPercent),
      allergies: Array.isArray(parsed.allergies)
        ? (parsed.allergies as UserProfile['allergies'])
        : [],
      intolerances: Array.isArray(parsed.intolerances)
        ? (parsed.intolerances as UserProfile['intolerances'])
        : [],
      diet: (parsed.diet as UserProfile['diet']) ?? 'omnivore',
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

export async function loadProfile(): Promise<UserProfile | null> {
  const adapter = await getStorageAdapter();
  return parseProfile(await adapter.getItem(STORAGE_KEYS.profile));
}

/** Persists the profile and stamps `updatedAt`. Returns what was written. */
export async function saveProfile(draft: ProfileDraft): Promise<UserProfile> {
  const adapter = await getStorageAdapter();
  const profile: UserProfile = { ...draft, updatedAt: Date.now() };
  await adapter.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  return profile;
}

/** Right to erasure: removes every personal record from the device. */
export async function clearProfile(): Promise<void> {
  const adapter = await getStorageAdapter();
  await adapter.removeItem(STORAGE_KEYS.profile);
}

/* -------------------------------------------------------------------------
 * App settings (non-personal)
 * ---------------------------------------------------------------------- */

export type AppSettings = {
  /** Emergency Mode simulation: share of nominal water resource, 0..1. */
  waterAvailability: number;
  emergencyMode: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  waterAvailability: 1,
  emergencyMode: false,
};

export async function loadSettings(): Promise<AppSettings> {
  const adapter = await getStorageAdapter();
  try {
    const raw = await adapter.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return DEFAULT_SETTINGS;
    return {
      waterAvailability:
        typeof parsed.waterAvailability === 'number'
          ? Math.min(Math.max(parsed.waterAvailability, 0), 1)
          : DEFAULT_SETTINGS.waterAvailability,
      emergencyMode: Boolean(parsed.emergencyMode),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const adapter = await getStorageAdapter();
  await adapter.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}
