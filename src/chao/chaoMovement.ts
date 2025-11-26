import {
    SITTING_CHANCE_WHILE_IDLE,
    MOVEMENT_CHANCE_AFTER_IDLE,
    FALLING_CHANCE_WHILE_MOVING,
    BASE_IDLE_PROBABILITY,
    IDLE_PROBABILITY_STEP_INCREASE,
    MAX_IDLE_PROBABILITY,
    MIN_IDLE_TIME_MS,
    MIN_MOVING_TIME_MS,
    IDLE_PROBABILITY_STEP_INTERVAL,
    MIN_MOVING_TIME_BEFORE_FALLING_MS,
    FALL_COOLDOWN_MS,
    MIN_SITTING_TIME_MS,
    BASE_STOP_SITTING_PROBABILITY,
    STOP_SITTING_PROBABILITY_STEP_INCREASE,
    MAX_STOP_SITTING_PROBABILITY,
    STOP_SITTING_PROBABILITY_STEP_INTERVAL,
    FLYING_CHANCE_AFTER_IDLE,
    CODE_WATCH_PROBABILITY,
    PAUSE_BETWEEN_CODE_WATCH_MS,
} from '../calculationConstants';
import { IdleState } from './state/IdleState';
import { MovingLeftState } from './state/MovingLeftState';
import { MovingRightState } from './state/MovingRightState';
import { FallingState } from './state/FallingState';
import { FlyingLeftState } from './state/FlyingLeft';
import { FlyingRightState } from './state/FlyingRight';
import { Chao } from './chao';
import { ChaoState, MovingDirection } from './chaoState';
import { AbstractMovingState } from './state/AbstractMovingState';
import { SittingState } from './state/SittingState';
import { getSidebarPosition } from '../panel/main';
import { LookAtCodeToLeftState } from './state/LookAtCodeToLeftState';
import { LookAtCodeToRightState } from './state/LookAtCodeToRightState';

export class ChaoMovement {
    // private sittingTimer: NodeJS.Timeout | null = null;
    private sittingStartTime: number | null = null;
    public sittingSteps: number = 0;
    public hasSatDuringIdle: boolean = false;

    private fallingTimer: NodeJS.Timeout | null = null;
    private fallingMovementTimer: NodeJS.Timeout | null = null;
    public lastFallTime: number = 0;

    private lookAtCodeTimer: NodeJS.Timeout | null = null;
    private lastLookAtCodeTime: number = 0;

    public movingStartTime: number | null = null;

    constructor() {}

    // Update the chao's state and position
    updatePosition(chao: Chao) {
        const canvasWidth = window.innerWidth;
        const gifWidth = chao.getGifWidth();
        const maxPosition = canvasWidth - gifWidth;

        // Check if chao has reached boundaries while moving
        const atLeftBoundary = chao.currentPosition <= 0;
        const atRightBoundary = chao.currentPosition >= maxPosition;
        const state = chao.state.state;
        const wasMovingLeft =
            state === ChaoState.movingLeft || state === ChaoState.flyingLeft;
        const wasMovingRight =
            state === ChaoState.movingRight || state === ChaoState.flyingRight;

        if (
            (atLeftBoundary && wasMovingLeft) ||
            (atRightBoundary && wasMovingRight)
        ) {
            // If at boundary and was moving towards it, become idle
            chao.state = new IdleState(chao);
        } else {
            this.updateState(chao);
            chao.state.moveBasedOnState(chao);
        }

        chao.setDimensionsAndPosition();
    }

    updateState(chao: Chao) {
        let shouldIdle: boolean;
        let castedMovingState: AbstractMovingState;
        let random = Math.random();
        const currentTime = Date.now();

        switch (chao.state.state) {
            case ChaoState.idle:
                // Chance to sit if hasn't already sat during this idle period
                if (
                    random < SITTING_CHANCE_WHILE_IDLE &&
                    !this.hasSatDuringIdle
                ) {
                    chao.state = new SittingState(chao);
                    this.hasSatDuringIdle = true;
                    this.sittingStartTime = Date.now();
                    this.sittingSteps = 0;
                    //this.startSittingTimer(chao);
                    break;
                }

                const timeSinceLastLookAtCode =
                    Date.now() - this.lastLookAtCodeTime;
                if (timeSinceLastLookAtCode >= PAUSE_BETWEEN_CODE_WATCH_MS) {
                   
                    const canvasWidth = window.innerWidth;
                    const gifWidth = chao.getGifWidth();
                    const maxPosition = canvasWidth - gifWidth;
                    const leftThreshold = maxPosition * 0.20;
                    const rightThreshold = maxPosition * 0.80;
                    const isOnLeftSide = chao.currentPosition <= leftThreshold;
                    const isOnRightSide =
                        chao.currentPosition >= rightThreshold;

                    const explorerPosition = getSidebarPosition();
                    const explorerOnLeft = explorerPosition === 'left';
                    const explorerOnRight = explorerPosition === 'right';

                    if (isOnLeftSide && explorerOnRight) {
                        random = Math.random();
                        if (random < CODE_WATCH_PROBABILITY) {
                            chao.state = new LookAtCodeToLeftState();
                            this.startLookingAtCodeTimer(chao);
                            break;
                        }
                    }

                    if (isOnRightSide && explorerOnLeft) {
                        random = Math.random();
                        if (random < CODE_WATCH_PROBABILITY) {
                            chao.state = new LookAtCodeToRightState();
                            this.startLookingAtCodeTimer(chao);
                            break;
                        }
                    }
                }

                // Only allow movement after being idle for at least X seconds
                const now = Date.now();
                var castedIdleState = chao.state as IdleState;
                const idleDuration =
                    now - (castedIdleState.idleStartTime || now);
                if (idleDuration >= MIN_IDLE_TIME_MS) {
                    // Chance to start moving
                    if (random < MOVEMENT_CHANCE_AFTER_IDLE) {
                        // Check if chao is at boundaries to restrict movement direction
                        const canvasWidth = window.innerWidth;
                        const gifWidth = chao.getGifWidth();
                        const maxPosition = canvasWidth - gifWidth;

                        const atLeftBoundary = chao.currentPosition <= 0;
                        const atRightBoundary =
                            chao.currentPosition >= maxPosition;

                        const shouldFly =
                            Math.random() < FLYING_CHANCE_AFTER_IDLE;

                        if (atLeftBoundary) {
                            chao.state = shouldFly
                                ? new FlyingRightState()
                                : new MovingRightState();
                        } else if (atRightBoundary) {
                            chao.state = shouldFly
                                ? new FlyingLeftState()
                                : new MovingLeftState();
                        } else {
                            if (shouldFly) {
                                chao.state =
                                    Math.random() < 0.5
                                        ? new FlyingLeftState()
                                        : new FlyingRightState();
                            } else {
                                chao.state =
                                    Math.random() < 0.5
                                        ? new MovingLeftState()
                                        : new MovingRightState();
                            }
                        }

                        this.movingStartTime = Date.now(); // Track when moving period started
                        this.hasSatDuringIdle = false;
                    }
                }
                break;

            case ChaoState.movingLeft:
            case ChaoState.movingRight:
                castedMovingState = chao.state as AbstractMovingState;
                castedMovingState.movingSteps++;

                // Chance to fall while walking, but only after moving for at least 2 seconds
                const timeSinceLastFall = currentTime - this.lastFallTime;
                const timeMoving =
                    currentTime - (this.movingStartTime || currentTime);

                if (
                    random < FALLING_CHANCE_WHILE_MOVING &&
                    timeSinceLastFall >= FALL_COOLDOWN_MS &&
                    timeMoving >= MIN_MOVING_TIME_BEFORE_FALLING_MS
                ) {
                    // Store the direction chao was moving when it started falling
                    const fallingDirection =
                        chao.state.state === ChaoState.movingLeft
                            ? MovingDirection.left
                            : MovingDirection.right;

                    chao.state = new FallingState(fallingDirection);
                    this.startFallingTimer(chao);
                    break;
                }

                shouldIdle = this.shouldIdle(
                    castedMovingState.movingSteps,
                    currentTime,
                );

                if (shouldIdle) {
                    chao.state = new IdleState(chao);
                    this.movingStartTime = null;
                    this.hasSatDuringIdle = false;
                }
                // Otherwise continue in current direction (no state change needed)
                break;
            case ChaoState.flyingLeft:
            case ChaoState.flyingRight:
                castedMovingState = chao.state as AbstractMovingState;

                shouldIdle = this.shouldIdle(
                    castedMovingState.movingSteps,
                    currentTime,
                );

                if (shouldIdle) {
                    chao.state = new IdleState(chao);
                    this.movingStartTime = null;
                    this.hasSatDuringIdle = false;
                }
                // Otherwise continue in current direction (no state change needed)
                break;
            case ChaoState.sitting:
                this.sittingSteps++;

                const sittingCurrentTime = Date.now();
                const timeSitting =
                    sittingCurrentTime -
                    (this.sittingStartTime || sittingCurrentTime);

                // Only allow stopping after minimum sitting time
                if (timeSitting >= MIN_SITTING_TIME_MS) {
                    // Calculate dynamic stop sitting probability that increases with sitting duration
                    const baseStopSittingProbability =
                        BASE_STOP_SITTING_PROBABILITY;
                    const stepIncrease =
                        Math.floor(
                            this.sittingSteps /
                                STOP_SITTING_PROBABILITY_STEP_INTERVAL,
                        ) * STOP_SITTING_PROBABILITY_STEP_INCREASE;
                    const maxStopSittingProbability =
                        MAX_STOP_SITTING_PROBABILITY;
                    const currentStopSittingProbability = Math.min(
                        baseStopSittingProbability + stepIncrease,
                        maxStopSittingProbability,
                    );

                    if (random < currentStopSittingProbability) {
                        chao.state = new IdleState(chao);
                        this.sittingStartTime = null;
                        this.sittingSteps = 0;
                    }
                }

                break;

            case ChaoState.falling:
                // Falling state is handled by timer, no position updates during falling
                break;
            case ChaoState.lookingAtCode:
                // Looking At Code state is handled by timer, no position updates during this state
                break;
        }
    }

    shouldIdle(movingSteps: number, currentTime: number): boolean {
        // Calculate dynamic idle probability that increases with movement duration
        const random = Math.random();
        const baseIdleProbability = BASE_IDLE_PROBABILITY;
        const stepIncrease =
            Math.floor(movingSteps / IDLE_PROBABILITY_STEP_INTERVAL) *
            IDLE_PROBABILITY_STEP_INCREASE;
        const maxIdleProbability = MAX_IDLE_PROBABILITY;
        const currentIdleProbability = Math.min(
            baseIdleProbability + stepIncrease,
            maxIdleProbability,
        );

        const movingDuration =
            currentTime - (this.movingStartTime || currentTime);
        return (
            random < currentIdleProbability &&
            movingDuration >= MIN_MOVING_TIME_MS
        );
    }

    // The chao moves a bit while falling and then stops
    startFallingTimer(chao: Chao) {
        if (this.fallingTimer) {
            clearTimeout(this.fallingTimer);
        }
        if (this.fallingMovementTimer) {
            clearTimeout(this.fallingMovementTimer);
        }

        this.lastFallTime = Date.now();
        (chao.state as FallingState).canMoveWhileFalling = true;

        this.fallingMovementTimer = setTimeout(() => {
            (chao.state as FallingState).canMoveWhileFalling = false;
            this.fallingMovementTimer = null;
        }, 1300);

        // Falling GIF duration - approximately 8,5 seconds
        const fallingDuration = 8500;

        this.fallingTimer = setTimeout(() => {
            // After falling, transition back to idle state
            chao.state = new IdleState(chao);
            this.hasSatDuringIdle = false;
            this.fallingTimer = null;
        }, fallingDuration);
    }

    startLookingAtCodeTimer(chao: Chao) {
        if (this.lookAtCodeTimer) {
            clearTimeout(this.lookAtCodeTimer);
        }

        this.lastLookAtCodeTime = Date.now();
        this.lookAtCodeTimer = setTimeout(() => {
            chao.state = new IdleState(chao);
            this.lookAtCodeTimer = null;
        }, 11500);
    }

    stop() {
        if (this.fallingTimer) {
            clearTimeout(this.fallingTimer);
            this.fallingTimer = null;
        }
        if (this.fallingMovementTimer) {
            clearTimeout(this.fallingMovementTimer);
            this.fallingMovementTimer = null;
        }
        if (this.lookAtCodeTimer) {
            clearTimeout(this.lookAtCodeTimer);
            this.lookAtCodeTimer = null;
        }
    }
}
