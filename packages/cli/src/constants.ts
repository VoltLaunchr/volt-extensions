/**
 * Valid extension categories — mirrors ExtensionCategory from Volt
 * @see Volt-public/src/features/extensions/types/extension.types.ts
 */
export const VALID_CATEGORIES = [
  'productivity',
  'utilities',
  'developer',
  'media',
  'social',
  'finance',
  'games',
  'system',
  'other',
] as const;

export type ExtensionCategory = (typeof VALID_CATEGORIES)[number];

/**
 * Valid extension permissions — mirrors ExtensionPermission from Volt
 * @see Volt-public/src/features/extensions/types/extension.types.ts
 */
export const VALID_PERMISSIONS = [
  'clipboard',
  'network',
  'notifications',
  'openUrl',
  'oauth',
  'ai',
  'system',
] as const;

export type ExtensionPermission = (typeof VALID_PERMISSIONS)[number];

export const KEBAB_CASE_REGEX = /^[a-z][a-z0-9-]*$/;
export const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

export const REGISTRY_BASE_URL =
  'https://github.com/VoltLaunchr/volt-extensions/releases/download';
