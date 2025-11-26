import { Chao } from "../chao";
import { ChaoState } from "../chaoState";
import { AbstractMovingState } from "./AbstractMovingState";

export class LookAtCodeToLeftState extends AbstractMovingState    {

      constructor() {
        super(ChaoState.lookingAtCode);
      }

      getGifStateName(): string {
        return 'code_watch_to_left';
      }

      // eslint-disable-next-line no-unused-vars
      moveBasedOnState(chao: Chao): void {
        // No movement while looking at code
      }

      getScaleForGif(): number {
           return 1;
      }

}