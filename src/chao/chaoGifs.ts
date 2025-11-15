import { ChaoType } from './chaoTypes';

const gifFiles = [
    'idle',
    'walking',
    'falling',
    'sitting',
    'standing_happy',
    'sitting_happy',
    'flying',
];

export type ChaoGifUris = Record<string, string>;

let chaoTypeUrisSingleton: Record<string, ChaoGifUris> | null = null;

export function createChaoTypeUris(
    baseUrl: string,
): Record<string, ChaoGifUris> {
    // If already created for this webview/extensionUri, return the singleton
    if (chaoTypeUrisSingleton) {
        return chaoTypeUrisSingleton;
    }

    const createGifUri = (chaoType: ChaoType, gifFile: string): string => {
        const filename = `${chaoType}_${gifFile}.gif`;
        return `${baseUrl}/${chaoType}/${filename}`;
    };

    const extractStateName = (gifFile: string): string => {
        return gifFile.replace('.gif', '');
    };

    chaoTypeUrisSingleton = Object.values(ChaoType).reduce((acc, chaoType) => {
        acc[chaoType] = gifFiles.reduce((gifs, gifFile) => {
            const stateName = extractStateName(gifFile);
            gifs[stateName] = createGifUri(chaoType, gifFile);
            return gifs;
        }, {} as ChaoGifUris);
        return acc;
    }, {} as Record<string, ChaoGifUris>);
    return chaoTypeUrisSingleton;
}
