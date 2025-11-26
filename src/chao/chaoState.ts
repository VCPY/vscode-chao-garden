// Proper TypeScript enum for chao states
export enum ChaoState {
    idle,
    movingLeft,
    movingRight,
    falling,
    sitting,
    flyingLeft,
    flyingRight,
    lookingAtCode,
}

export enum MovingDirection {
    left = "left",
    right = "right",
}
