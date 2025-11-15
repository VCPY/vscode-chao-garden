// Proper TypeScript enum for chao states
export enum ChaoState {
    idle,
    movingLeft,
    movingRight,
    falling,
    sitting,
    flyingLeft,
    flyingRight,
}

export enum MovingDirection {
    left = "left",
    right = "right",
}
