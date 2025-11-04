import type { Platform } from './api'

/**
 * Platform validation result
 */
export interface PlatformValidation {
  platform: Platform
  isValid: boolean
}

/**
 * Valid platform values
 */
export const VALID_PLATFORMS: Platform[] = ['pc', 'ps4', 'xb1', 'swi']

/**
 * Default platform
 */
export const DEFAULT_PLATFORM: Platform = 'pc'

/**
 * Validates and normalizes a platform string
 * @param platformParam - The platform parameter to validate
 * @returns A validated Platform value (defaults to 'pc' if invalid)
 */
export function validatePlatform(platformParam: string | null): Platform {
  if (!platformParam) {
    return DEFAULT_PLATFORM
  }

  const normalized = platformParam.toLowerCase() as Platform
  return VALID_PLATFORMS.includes(normalized) ? normalized : DEFAULT_PLATFORM
}

/**
 * Validates a platform and returns validation result
 * @param platformParam - The platform parameter to validate
 * @returns PlatformValidation object with platform and isValid flag
 */
export function validatePlatformStrict(
  platformParam: string | null,
): PlatformValidation {
  if (!platformParam) {
    return { platform: DEFAULT_PLATFORM, isValid: false }
  }

  const normalized = platformParam.toLowerCase() as Platform
  const isValid = VALID_PLATFORMS.includes(normalized)

  return {
    platform: isValid ? normalized : DEFAULT_PLATFORM,
    isValid,
  }
}

/**
 * Extracts platform from URL search params
 * @param url - The URL to extract platform from
 * @returns Validated Platform value
 */
export function getPlatformFromUrl(url: string | URL): Platform {
  const urlObj = typeof url === 'string' ? new URL(url) : url
  const platformParam = urlObj.searchParams.get('platform')
  return validatePlatform(platformParam)
}

