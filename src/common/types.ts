import { ChaoSize } from '../chao/chaoTypes';


export const enum ExtPosition {
    panel = 'panel',
    explorer = 'explorer',
}

export class WebviewMessage {
    text: string;
    command: string;

    constructor(text: string, command: string) {
        this.text = text;
        this.command = command;
    }
}
    export interface ActiveChaoListMessage extends WebviewMessage {
        command: 'activeChaoList';
        chaoList: Array<{ id: string; chaoType: string; name: string | null }>;
    }

export const ALL_SCALES = [ChaoSize.small, ChaoSize.medium, ChaoSize.large];
