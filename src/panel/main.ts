// This script will be run within the webview itself
import { WebviewMessage, ActiveChaoListMessage } from '../common/types';
import { Chao } from '../chao/chao';
import { ChaoSaveState } from '../chao/chaoSaveState';
import { ChaoGifUris, createChaoTypeUris } from '../chao/chaoGifs';
import { ChaoSize, ChaoType } from '../chao/chaoTypes';
import { initializeGifUris } from '../gifUriHelper';

/* This is how the VS Code API can be invoked from the panel */
declare global {
    interface VscodeStateApi {
        getState(): ChaoSaveState[] | undefined; // API is actually Any, but we want it to be typed.
        setState(state: ChaoSaveState[]): void;
        postMessage(message: WebviewMessage | ActiveChaoListMessage): void;
    }
    function acquireVsCodeApi(): VscodeStateApi;
}

const activeChaoObjects: Chao[] = [];
let _stateApi: VscodeStateApi | undefined = undefined;
let currentGifSize: ChaoSize = ChaoSize.medium;
// Temporary holder for name passed from extension when spawning
let lastSpawnName: string | null = null;

export function getStateApi(): VscodeStateApi {
    if (!_stateApi) {
        _stateApi = acquireVsCodeApi();
    }
    return _stateApi;
}

let canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;

function initCanvas() {
    canvas = document.getElementById('chaoCanvas') as HTMLCanvasElement;
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) {
        console.error('Canvas context not found');
        return;
    }
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
}

// It cannot access the main VS Code APIs directly.
export function chaoPanelApp(chaoBaseUri: string, initialGifSize: ChaoSize) {
    // Set the initial gif size from the extension
    currentGifSize = initialGifSize;
    var chaoTypeUris = createChaoTypeUris(chaoBaseUri);
    initializeGifUris(chaoTypeUris);
    const stateApi = getStateApi();

    var state = stateApi?.getState();
    if (!state) {
        // New session
        createRandomChao(chaoTypeUris);
        saveChaoState();
    } else {
        var res = loadChaoState();
        res.forEach((chaoData) => {
            loadChaoFromState(chaoData, chaoTypeUris);
        });
    }

    initCanvas();

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (event) => {
        const message = event.data;
        switch (message.command) {
            case 'spawnRandomChao':
                lastSpawnName = message.name || null;
                createRandomChao(chaoTypeUris);
                saveChaoState();
                break;
            case 'spawnSpecificChao':
                lastSpawnName = message.name || null;
                createSpecificChao(chaoTypeUris, message.chaoType);
                saveChaoState();
                break;
            case 'getActiveChaoList':
                const chaoList = getActiveChaoList();
                getStateApi().postMessage({
                    command: 'activeChaoList',
                    chaoList: chaoList,
                    text: '', // required by ActiveChaoListMessage
                });
                break;
            case 'deleteChao':
                deleteChaoById(message.chaoId);
                saveChaoState();
                break;
            case 'loadChaoState':
                if (message.chaoState && message.chaoState.length > 0) {
                    message.chaoState.forEach((chaoData: ChaoSaveState) => {
                        loadChaoFromState(chaoData, chaoTypeUris);
                    });
                } else {
                    // No saved state, create a random chao as default
                    const chao = new Chao(chaoTypeUris, currentGifSize);
                    chao.setRandomPosition();
                    chao.startAnimation();
                    activeChaoObjects.push(chao);
                    saveChaoState();
                }
                break;
            case 'patchChaoState':
                if (message.chaoState) {
                    patchChaoState(message.chaoState, chaoTypeUris);
                }
                break;
            case 'updateGifSize':
                currentGifSize = message.gifSize as ChaoSize;
                activeChaoObjects.forEach((chao) => {
                    chao.setGifSize(currentGifSize);
                    chao.setDimensionsAndPosition();
                });
                break;
            case 'vscodeShowWarningMessage':
                // Forward warning to extension
                const vscodeApi = getStateApi();
                vscodeApi.postMessage({
                    command: 'vscodeShowWarningMessage',
                    text: message.text,
                });
                break;
        }
    });
}
window.addEventListener('resize', function () {
    initCanvas();
});

function createRandomChao(chaoTypeUris: Record<string, ChaoGifUris>) {
    const maxChaoWarningShown = showMaxChaoWarning();
    if (maxChaoWarningShown) {
        return null;
    }

    if (!lastSpawnName) {
        lastSpawnName = 'Sammy';
    }

    // Create and initialize chao
    const chao = new Chao(chaoTypeUris, currentGifSize, null, lastSpawnName);
    // clear the temporary name after use
    lastSpawnName = null;
    chao.setRandomPosition();
    chao.startAnimation();
    activeChaoObjects.push(chao);

    return chao;
}

// Function to create a new chao with a specific type
function createSpecificChao(
    chaoTypeUris: Record<string, ChaoGifUris>,
    specificType: ChaoType,
) {
    const maxChaoWarningShown = showMaxChaoWarning();
    if (maxChaoWarningShown) {
        return null;
    }

    // Create and initialize chao with specific type
    const chao = new Chao(
        chaoTypeUris,
        currentGifSize,
        specificType,
        lastSpawnName,
    );
    // clear the temporary name after use
    lastSpawnName = null;
    chao.setRandomPosition();
    chao.startAnimation();
    activeChaoObjects.push(chao);

    return chao;
}

function showMaxChaoWarning() {
    const MAX_CHAO = 10;
    if (activeChaoObjects.length >= MAX_CHAO) {
        // Use VS Code webview API to show warning message
        getStateApi().postMessage({
            command: 'vscodeShowWarningMessage',
            text: `Maximum number of chao reached (${MAX_CHAO}). Please delete some chao before adding more.`,
        });
        return true;
    }
    return false;
}

function saveChaoState() {
    const chaoState = serializeChaoState();
    getStateApi()?.setState(chaoState);
}

function loadChaoState(): ChaoSaveState[] {
    return getStateApi().getState() || [];
}

function serializeChaoState(): ChaoSaveState[] {
    return activeChaoObjects.map((chao: Chao) => chao.serialize());
}

function getActiveChaoList() {
    return activeChaoObjects.map((chao: Chao) => ({
        id: chao.element.id,
        chaoType: chao.chaoType,
        name: chao.name || null,
    }));
}

function deleteChaoById(chaoId: string): boolean {
    const chaoIndex = activeChaoObjects.findIndex(
        (chao) => chao.element.id === chaoId,
    );
    if (chaoIndex !== -1) {
        const chao = activeChaoObjects[chaoIndex];

        chao.stopAnimation();
        chao.element.remove();
        activeChaoObjects.splice(chaoIndex, 1);

        return true;
    }
    return false;
}

export function loadChaoFromState(
    chaoData: ChaoSaveState,
    chaoTypeUris: Record<string, ChaoGifUris>,
) {
    // Create chao with specific type and restore state
    const chao = new Chao(
        chaoTypeUris,
        currentGifSize,
        chaoData.chaoType as ChaoType,
    );

    // Restore chao state using the new method
    chao.restoreState(chaoData);
    chao.setDimensionsAndPosition();
    chao.startAnimation();

    activeChaoObjects.push(chao);

    return chao;
}
function patchChaoState(
    newChaoState: ChaoSaveState[],
    chaoTypeUris: Record<string, ChaoGifUris>,
) {
    const currentChaoIds = activeChaoObjects.map((chao) => chao.element.id);
    const newChaoIds = newChaoState.map((chaoData) => chaoData.id);

    // Check if there are any differences between current and stored state
    const hasChanges =
        currentChaoIds.length !== newChaoIds.length ||
        !currentChaoIds.every((id) => newChaoIds.includes(id));

    if (!hasChanges) {
        return;
    }

    const chaoToRemove = activeChaoObjects.filter(
        (chao) => !newChaoIds.includes(chao.element.id),
    );
    chaoToRemove.forEach((chao) => {
        chao.stopAnimation();
        chao.element.remove();
    });

    const remainingChao = activeChaoObjects.filter((chao) =>
        newChaoIds.includes(chao.element.id),
    );
    activeChaoObjects.length = 0;
    activeChaoObjects.push(...remainingChao);

    newChaoState.forEach((chaoData) => {
        const existingChao = activeChaoObjects.find(
            (chao) => chao.element.id === chaoData.id,
        );
        if (!existingChao) {
            loadChaoFromState(chaoData, chaoTypeUris);
        }
    });
}
