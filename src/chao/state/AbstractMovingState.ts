import { ChaoState } from '../chaoState';
import { AbstractChaoState } from './AbstractChaoState';

export abstract class AbstractMovingState extends AbstractChaoState {
	movingSteps: number;

	constructor(state: ChaoState) {
		super(state);
		this.movingSteps = 0;
	}

}
