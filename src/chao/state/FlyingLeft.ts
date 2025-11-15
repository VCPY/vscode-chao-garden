import { Chao } from '../chao';
import { ChaoState } from '../chaoState';
import { AbstractMovingState } from './AbstractMovingState';

export class FlyingLeftState extends AbstractMovingState {
    constructor() {
        super(ChaoState.flyingLeft);
    }

    getGifStateName(): string {
        return 'flying';
    }

    moveBasedOnState(chao: Chao): void {
        chao.currentPosition -= chao.speed;
    }

    getScaleForGif(): number {
        return 1;
    }
}
