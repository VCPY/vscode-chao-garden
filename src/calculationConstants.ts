// Probability constants for Chao behavior and movement

export const SITTING_CHANCE_WHILE_IDLE: number = 0.01; // 1% chance to sit when idle
export const MOVEMENT_CHANCE_AFTER_IDLE: number = 0.3; // 30% chance to start moving after idle period
export const FLYING_CHANCE_AFTER_IDLE: number = 0.005; // 0,5% chance to start flying after idle period

export const FALLING_CHANCE_WHILE_MOVING: number = 0.001; // 0.1% chance to fall while walking

export const BASE_IDLE_PROBABILITY: number = 0.01; // Starting idle probability (1%)
export const IDLE_PROBABILITY_STEP_INCREASE: number = 0.005; // Increase per step interval (0.5%)
export const MAX_IDLE_PROBABILITY: number = 0.25; // Maximum idle probability (25%)

export const MIN_IDLE_TIME_MS: number = 7000; // Minimum time idle before allowing transitions (7 seconds)
export const MIN_MOVING_TIME_MS: number = 7000; // Minimum time moving before considering idle (7 seconds)
export const IDLE_PROBABILITY_STEP_INTERVAL: number = 10; // Steps interval for probability increase

export const MIN_MOVING_TIME_BEFORE_FALLING_MS: number = 2000; // Minimum 2 seconds of movement before falling is allowed
export const FALL_COOLDOWN_MS: number = 30000; // 30 seconds cooldown between falls

export const MIN_SITTING_TIME_MS: number = 10000; // Minimum sitting time (10 seconds)
export const BASE_STOP_SITTING_PROBABILITY: number = 0.02; // Starting probability to stop sitting (2%)
export const STOP_SITTING_PROBABILITY_STEP_INCREASE: number = 0.005; // Increase per step interval (0.5%)
export const MAX_STOP_SITTING_PROBABILITY: number = 0.5; // Maximum stop sitting probability (50%)
export const STOP_SITTING_PROBABILITY_STEP_INTERVAL: number = 10; // Steps interval for probability increase