import { ChaoState } from '../chaoState';
import { AbstractMovingState } from './AbstractMovingState';

export class MovingRightState extends AbstractMovingState {
    constructor() {
        super(ChaoState.movingRight);
    }

    getStateName(): string {
        return 'walking';
    }

    moveBasedOnState(chao: any): void {
        chao.currentPosition += chao.speed;
    }
}
