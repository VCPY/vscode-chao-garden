import { generateGifUri } from '../../gifUriHelper';
import { Chao } from '../chao';
import { ChaoState } from '../chaoState';
import { AbstractChaoState } from './AbstractChaoState';

export class SittingState extends AbstractChaoState {
    chao: Chao;

    constructor(chao: Chao) {
        super(ChaoState.sitting);
        this.chao = chao;
    }

    getGifStateName(): string {
        return 'sitting';
    }

    // eslint-disable-next-line no-unused-vars
    moveBasedOnState(chao: Chao): void {
        // No movement during sitting
    }

    getGif(chaoType: string): string {
        if (this.chao.isHovered) {
            return generateGifUri(chaoType, 'sitting_happy');
        }
        return super.getGif(chaoType);
    }
}
