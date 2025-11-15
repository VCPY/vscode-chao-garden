import { generateGifUri } from '../../gifUriHelper';
import { Chao } from '../chao';
import { ChaoState } from '../chaoState';

export abstract class AbstractChaoState {
    state: ChaoState;

    constructor(state: ChaoState) {
        this.state = state;
    }

    /**
     * Get this state's corresponding GIF filename part
     * Must be implemented by subclasses
     */
    abstract getGifStateName(): string;

    /**
     * Abstract method to move chao based on the current state
     * @param chao - The chao object to move
     */
    abstract moveBasedOnState(chao: Chao): void;

    getGif(chaoType: string): string {
        const stateName = this.getGifStateName();
        return generateGifUri(chaoType, stateName);
    }

    stopAnimation(): void {
        // Default implementation does nothing
        // Subclasses can override if needed
    }

    getScaleForGif(): string | number {
        return '-1';
    }
}
