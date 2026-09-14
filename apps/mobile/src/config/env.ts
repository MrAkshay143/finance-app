import { resolveServiceUrls, resolveAssetUrl as sharedResolveAssetUrl } from '@finance/api-client';

// Mobile backend link configuration
const rawUrl = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL;
export const serviceUrls = resolveServiceUrls(rawUrl);

export function getBaseUrl(): string {
  return serviceUrls.apiBaseUrl;
}

export function getSocketUrl(): string {
  return serviceUrls.socketUrl;
}

export function resolveAssetUrl(relativePathOrUrl: string | null | undefined): string | undefined {
  return sharedResolveAssetUrl(relativePathOrUrl, serviceUrls.origin);
}

export default serviceUrls;
