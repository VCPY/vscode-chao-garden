import { ChaoType } from './chaoTypes';

export type ChaoGifUris = {
    idle: string;
    walking: string;
    falling: string;
    sitting: string;
    standing_happy: string;
    sitting_happy: string;
};

let chaoTypeUrisSingleton: Record<string, ChaoGifUris> | null = null;

export function createChaoTypeUris(
    baseUrl: string,
): Record<string, ChaoGifUris> {
    // If already created for this webview/extensionUri, return the singleton
    if (chaoTypeUrisSingleton) {
        return chaoTypeUrisSingleton;
    }

    const gifStates = [
        'idle',
        'walking',
        'falling',
        'sitting',
        'standing_happy',
        'sitting_happy',
    ] as const;

    const createGifUri = (chaoType: ChaoType, state: string): string => {
        const filename = `${chaoType}_${state}.gif`;
        return `${baseUrl}/${chaoType}/${filename}`;
    };

    chaoTypeUrisSingleton = Object.values(ChaoType).reduce((acc, chaoType) => {
        acc[chaoType] = gifStates.reduce((gifs, state) => {
            gifs[state] = createGifUri(chaoType, state);
            return gifs;
        }, {} as ChaoGifUris);
        return acc;
    }, {} as Record<string, ChaoGifUris>);
    return chaoTypeUrisSingleton;
}
