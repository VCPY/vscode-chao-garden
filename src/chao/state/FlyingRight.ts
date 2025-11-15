import { Chao } from '../chao';
import { ChaoState } from '../chaoState';
import { AbstractMovingState } from './AbstractMovingState';

export class FlyingRightState extends AbstractMovingState {
    constructor() {
        super(ChaoState.flyingRight);
    }

    getGifStateName(): string {
        return 'flying';
    }

    moveBasedOnState(chao: Chao): void {
        chao.currentPosition += chao.speed;
    }
}
