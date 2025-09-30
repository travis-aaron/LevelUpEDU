import type {Scene} from '@/scenes/Scene'

export class InputHandler {
    private scene: Scene
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys
    private movementState: {
        left: boolean
        right: boolean
        up: boolean
        down: boolean
    }

    private targetPosition: {x: number; y: number} | null = null
    private isMousePressed: boolean = false
    private moveSpeed: number = 100
    private movementBlocked: boolean = false

    constructor(scene: Scene, moveSpeed: number = 100) {
        this.scene = scene
        this.moveSpeed = moveSpeed
        this.movementState = {
            left: false,
            right: false,
            up: false,
            down: false,
        }
        this.cursors = scene.input.keyboard!.createCursorKeys()
        this.setupKeyboardInput()
        this.setupBrowserEvents()
    }

    private setupKeyboardInput(): void {
        this.scene.input.keyboard!.on('keydown-W', () =>
            this.handleMovement('up', true)
        )
        this.scene.input.keyboard!.on('keyup-W', () =>
            this.handleMovement('up', false)
        )
        this.scene.input.keyboard!.on('keydown-S', () =>
            this.handleMovement('down', true)
        )
        this.scene.input.keyboard!.on('keyup-S', () =>
            this.handleMovement('down', false)
        )
        this.scene.input.keyboard!.on('keydown-A', () =>
            this.handleMovement('left', true)
        )
        this.scene.input.keyboard!.on('keyup-A', () =>
            this.handleMovement('left', false)
        )
        this.scene.input.keyboard!.on('keydown-D', () =>
            this.handleMovement('right', true)
        )
        this.scene.input.keyboard!.on('keyup-D', () =>
            this.handleMovement('right', false)
        )
    }

    private setupBrowserEvents(): void {
        window.addEventListener('blur', () => {
            this.stopAllMovement()
        })
    }

    public handleMovement(
        direction: 'up' | 'down' | 'left' | 'right',
        active: boolean
    ): void {
        this.movementState[direction] = active
    }

    public setTargetPosition(x: number, y: number): void {
        if (this.movementBlocked) return
        this.isMousePressed = true
        this.targetPosition = {x, y}
    }

    public updateTargetPosition(x: number, y: number): void {
        if (this.movementBlocked || !this.isMousePressed) return
        this.targetPosition = {x, y}
    }

    public releaseTarget(): void {
        this.isMousePressed = false
        this.targetPosition = null
        this.stopAllMovement()
    }

    public stopAllMovement(): void {
        this.movementState.left = false
        this.movementState.right = false
        this.movementState.up = false
        this.movementState.down = false
        this.targetPosition = null
        this.isMousePressed = false
    }

    public blockMovement(): void {
        this.movementBlocked = true
        this.stopAllMovement()
    }

    public unblockMovement(): void {
        this.movementBlocked = false
    }

    public update(player: Phaser.Physics.Arcade.Sprite): void {
        if (!player || this.movementBlocked) {
            const body = player.body as Phaser.Physics.Arcade.Body
            body.setVelocity(0, 0)
            player.stop()
            return
        }

        // cast player body or Phaser assumes its static
        const body = player.body as Phaser.Physics.Arcade.Body
        let moving = false
        let primaryAnimation = ''

        if (this.targetPosition) {
            const distance = Phaser.Math.Distance.Between(
                player.x,
                player.y,
                this.targetPosition.x,
                this.targetPosition.y
            )

            if (distance > 5) {
                const deltaX = this.targetPosition.x - player.x
                const deltaY = this.targetPosition.y - player.y
                const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
                const normalizedX = deltaX / length
                const normalizedY = deltaY / length

                body.setVelocity(
                    normalizedX * this.moveSpeed,
                    normalizedY * this.moveSpeed
                )

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    primaryAnimation = deltaX < 0 ? 'walk_left' : 'walk_right'
                } else {
                    primaryAnimation = deltaY < 0 ? 'walk_up' : 'walk_down'
                }
                moving = true
            } else {
                this.targetPosition = null
                body.setVelocity(0, 0)
            }
        } else {
            const leftPressed =
                this.cursors.left.isDown || this.movementState.left
            const rightPressed =
                this.cursors.right.isDown || this.movementState.right
            const upPressed = this.cursors.up.isDown || this.movementState.up
            const downPressed =
                this.cursors.down.isDown || this.movementState.down

            let velocityX = 0
            let velocityY = 0

            if (leftPressed) {
                velocityX = -this.moveSpeed
                primaryAnimation = 'walk_left'
                moving = true
            } else if (rightPressed) {
                velocityX = this.moveSpeed
                primaryAnimation = 'walk_right'
                moving = true
            }

            if (upPressed) {
                velocityY = -this.moveSpeed
                if (!primaryAnimation) primaryAnimation = 'walk_up'
                moving = true
            } else if (downPressed) {
                velocityY = this.moveSpeed
                if (!primaryAnimation) primaryAnimation = 'walk_down'
                moving = true
            }

            body.setVelocity(velocityX, velocityY)
        }

        if (moving && primaryAnimation) {
            player.play(primaryAnimation, true)
        } else {
            player.stop()
        }
    }
}
