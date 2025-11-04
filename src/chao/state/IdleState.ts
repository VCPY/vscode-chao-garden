import { generateGifUri } from '../../gifUriHelper';
import { ChaoState } from '../chaoState';
import { Chao } from '../chao';
import { AbstractChaoState } from './AbstractChaoState';

export class IdleState extends AbstractChaoState {
    chao: Chao;
    idleStartTime: number;

    constructor(chao: Chao) {
        super(ChaoState.idle);
        this.chao = chao;
        this.idleStartTime = Date.now();
    }

    getStateName(): string {
        return 'idle';
    }

    // eslint-disable-next-line no-unused-vars
    moveBasedOnState(chao: Chao): void {
        // No movement in idle state
    }

    getGif(chaoType: string): string {
        if (this.chao.isHovered) {
            return generateGifUri(chaoType, 'standing_happy');
        }
        return super.getGif(chaoType);
    }
}
