
// URI helper for loading GIF resources in webview context

import { ChaoGifUris } from "./chao/chaoGifs";

// Global storage for webview URIs provided by the extension
let globalChaoTypeUris: Record<string, ChaoGifUris> | null = null;

/**
 * Initialize the global chao type URIs from the extension
 * @param {Object} chaoTypeUris - The webview URIs provided by the extension
 */
export function initializeGifUris(chaoTypeUris: Record<string, ChaoGifUris>) {
  globalChaoTypeUris = chaoTypeUris;
}

export function generateGifUri(chaoType: string, stateName: string): string {
  if (!globalChaoTypeUris) {
    console.error('Chao type URIs not initialized. Call initializeGifUris() first.');
    return '';
  }

  const chaoGifUris = globalChaoTypeUris[chaoType];
  if (!chaoGifUris) {
    console.error(`No URIs found for chao type: ${chaoType}`);
    return '';
  }

  if (!(stateName in chaoGifUris)) {
    console.error(`No URI found for chao type: ${chaoType}, state: ${stateName}`);
    return '';
  }

  return chaoGifUris[stateName as keyof typeof chaoGifUris];
}