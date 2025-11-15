import { Chao } from '../chao';
import { ChaoState, MovingDirection } from '../chaoState';
import { AbstractChaoState } from './AbstractChaoState';

export class FallingState extends AbstractChaoState {
    fallingDirection: MovingDirection;
    canMoveWhileFalling: boolean;

    constructor(fallingDirection: MovingDirection) {
        super(ChaoState.falling);
        this.fallingDirection = fallingDirection;
        this.canMoveWhileFalling = true;
    }

    getGifStateName(): string {
        return 'falling';
    }

    moveBasedOnState(chao: Chao): void {
        if (this.canMoveWhileFalling && this.fallingDirection) {
            if (this.fallingDirection === MovingDirection.left) {
                chao.currentPosition -= chao.speed;
            } else if (this.fallingDirection === MovingDirection.right) {
                chao.currentPosition += chao.speed;
            }
        }
    }

    getScaleForGif(): number {
        return this.fallingDirection === MovingDirection.left ? 1 : -1;
    }
}
