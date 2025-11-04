import { Chao } from '../chao';
import { ChaoState } from '../chaoState';
import { AbstractMovingState } from './AbstractMovingState';

export class MovingLeftState extends AbstractMovingState {
    constructor() {
        super(ChaoState.movingLeft);
    }

    getStateName(): string {
        return 'walking';
    }

    moveBasedOnState(chao: Chao): void {
        chao.currentPosition -= chao.speed;
    }

    getScaleForGif(): number {
        return 1;
    }
}
