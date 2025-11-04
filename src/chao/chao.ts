import { ChaoState } from './chaoState';
import { ChaoMovement } from './chaoMovement';
import { ChaoSize, ChaoType } from './chaoTypes';
import { ChaoGifUris } from './chaoGifs';
import { AbstractChaoState } from './state/AbstractChaoState';
import { IdleState } from './state/IdleState';
import { ChaoSaveState } from './chaoSaveState';

export class Chao {
    public element: HTMLImageElement;
    public name: string | null;
    public chaoType: ChaoType;
    private _currentPosition: number;
    public isHovered: boolean;
    public speed: number;
    private gifUris: { [key: string]: string };
    private _state: AbstractChaoState;
    private gifSize: ChaoSize;
    private movement: ChaoMovement;
    private animationInterval: NodeJS.Timeout | null;

    constructor(
        chaoTypeUris: Record<string, ChaoGifUris>,
        gifSize: ChaoSize,
        specificType: ChaoType | null = null,
        name: string | null = null,
    ) {
        this.chaoType = specificType || this.selectRandomChaoType();
        this.name = name || null;
        this.gifUris = chaoTypeUris[this.chaoType];
        this._currentPosition = 0; // Position in pixels from left side
        this._state = new IdleState(this);
        this.speed = 1;
        this.animationInterval = null;

        this.isHovered = false;
        this.gifSize = gifSize;

        this.element = document.createElement('img');
        this.createDomElement();
        this.movement = new ChaoMovement();
    }

    public get currentPosition(): number {
        return this._currentPosition;
    }

    public set currentPosition(value: number) {
        const gifWidth = this.getGifWidth();
        function maxPosition() {
            const canvasWidth = window.innerWidth;
            return canvasWidth - gifWidth;
        }

        if (value < 0) {
            this._currentPosition = 0;
        } else if (value > maxPosition()) {
            this._currentPosition = maxPosition();
        } else {
            this._currentPosition = value;
        }
    }

    public get state(): AbstractChaoState {
        return this._state;
    }

    public set state(newState: AbstractChaoState) {
        this._state = newState;
        this.updateGifForState();
    }

    // Select a random chao type from the available options
    selectRandomChaoType(): ChaoType {
        const typeValues = Object.values(ChaoType) as ChaoType[];
        if (typeValues.length === 0) {
            console.error(
                'No ChaoType enum values found! Setting to neutralChao by default.',
            );
            return ChaoType.neutralChao;
        }
        const randomIndex = Math.floor(Math.random() * typeValues.length);
        return typeValues[randomIndex];
    }

    createDomElement() {
        this.element.className = 'chao';
        this.element.id =
            'chao-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        this.element.src = this.gifUris.idle;

        // Add hover event listeners
        this.element.addEventListener('mouseenter', () => {
            this.isHovered = true;
            if (
                this.state.state === ChaoState.idle ||
                this.state.state === ChaoState.sitting
            ) {
                this.updateGifForState();
            }
        });

        this.element.addEventListener('mouseleave', () => {
            this.isHovered = false;
            if (
                this.state.state === ChaoState.idle ||
                this.state.state === ChaoState.sitting
            ) {
                this.updateGifForState();
            }
        });

        const canvasContainer = document.getElementById('chaoContainer');
        if (canvasContainer) {
            canvasContainer.appendChild(this.element);
        }
    }

    position() {
        this.element.style.left = this.currentPosition + 'px';
    }

    setDimensions() {
        let px = 40; // Default medium size
        if (this.gifSize === ChaoSize.small) {
            px = 25;
        } else if (this.gifSize === ChaoSize.large) {
            px = 60;
        }
        this.element.style.width = px + 'px';
        this.element.style.height = 'auto';
    }

    setDimensionsAndPosition() {
        this.setDimensions();
        this.position();
    }

    setGifSize(newSize: ChaoSize | undefined) {
        if (newSize) {
            this.gifSize = newSize;
        } else {
            this.gifSize = ChaoSize.medium;
        }
        this.setDimensionsAndPosition();
    }

    startAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
        this.animationInterval = setInterval(
            () => this.movement.updatePosition(this),
            100,
        );
    }

    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }

        this.movement.stop();

        // Reset hover state
        this.isHovered = false;
    }

    setRandomPosition() {
        // First position the element to get accurate dimensions
        this.setDimensions();

        const canvasWidth = window.innerWidth;
        const gifWidth = this.getGifWidth();
        const maxPosition = Math.max(0, canvasWidth - gifWidth);

        this.currentPosition = Math.random() * maxPosition;
        this.state = new IdleState(this);
        this.setDimensions();
    }

    getGifWidth() {
        return this.element.getBoundingClientRect().width;
    }

    updateGifForState() {
        const newSrc = this.state.getGif(this.chaoType);

        // Only update if the source has changed to avoid unnecessary reloads
        if (this.element.src !== newSrc) {
            // Add timestamp to force GIF to restart from beginning
            this.element.src = newSrc + '?t=' + Date.now();
        }

        // Mirror the gif if necessary
        this.element.style.transform = `scaleX(${this.state.getScaleForGif()})`;
    }

    initialize() {
        this.setRandomPosition();
        this.startAnimation();
    }

    adjustPositionAfterResize(): void {
        this.currentPosition = this.currentPosition; // Re-apply current position to enforce boundaries
    }

    serialize(): ChaoSaveState {
        return {
            id: this.element.id,
            chaoType: this.chaoType,
            name: this.name,
        };
    }

    restoreState(data: ChaoSaveState) {
        this.element.id = data.id;

        // Get canvas and calculate proper positioning
        const canvasContainer = document.getElementById('chaoContainer');
        const canvasWidth = canvasContainer
            ? canvasContainer.getBoundingClientRect().width
            : window.innerWidth;
        const gifWidth = this.getGifWidth();
        const maxPosition = Math.max(0, canvasWidth - gifWidth);

        this.currentPosition = Math.random() * maxPosition;
        this.state = new IdleState(this); // Always start in IDLE state on load
        this.chaoType = data.chaoType as ChaoType;
        this.name = data.name || null;

        this.setDimensionsAndPosition();
    }
}
