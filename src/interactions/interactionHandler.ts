import type { Scene } from '@/scenes/Scene'
import type { TiledObject } from '@/types'
import { interactionRegistry } from './interactionRegistry'

export interface InteractionConfig {
    name: string
    type: string
    tooltip?: string
    canInteract: boolean
    onInteract?: (scene: Scene) => void
}

export class InteractionHandler {
    private scene: Scene
    private interactionGroup: Phaser.Physics.Arcade.StaticGroup
    private currentInteractionObject: Phaser.GameObjects.Rectangle | null = null
    private interactionKey: Phaser.Input.Keyboard.Key
    private nameTagText: Phaser.GameObjects.Text
    private interactionPrompt: Phaser.GameObjects.Text
    private interactions: Map<string, InteractionConfig> = new Map()
    private isInterfaceOpen: boolean = false

    constructor(scene: Scene) {
        this.scene = scene
        this.interactionGroup = scene.physics.add.staticGroup()
        this.interactionKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)

        // Create UI elements
        this.nameTagText = scene.add.text(0, 0, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setVisible(false).setDepth(1000)

        this.interactionPrompt = scene.add.text(0, 0, '', {
            fontSize: '14px',
            color: '#ffff00',
            backgroundColor: '#333333',
            padding: { x: 6, y: 3 }
        }).setVisible(false).setDepth(1001)

        // Set up overlap detection
        scene.physics.add.overlap(
            scene.player,
            this.interactionGroup,
            this.handleInteraction,
            undefined,
            this
        )
    }

    public blockMovement(): void {
        this.isInterfaceOpen = true
    }

    public unblockMovement(): void {
        this.isInterfaceOpen = false
    }

    public isMovementBlocked(): boolean {
        return this.isInterfaceOpen
    }

    public registerInteraction(key: string, config: InteractionConfig): void {
        this.interactions.set(key, config)
    }

    public createInteractionFromTiled(obj: TiledObject, sprite: Phaser.GameObjects.Image): void {
        if (!obj.properties?.active) return
        const bounds = sprite.getBounds()
        const interactionPadding = 20
        const interactionZone = this.scene.add.rectangle(
            bounds.centerX,
            bounds.centerY,
            bounds.width + interactionPadding * 2,
            bounds.height + interactionPadding * 2,
            0x00ff00,
            0
        )
        const config: InteractionConfig = {
            name: obj.properties.displayName || obj.name,
            type: obj.properties.eventType || obj.name,
            tooltip: obj.properties.tooltip || 'Press E to interact',
            canInteract: obj.properties.active ?? true
        }

        interactionZone.setData('config', config)
        this.scene.physics.add.existing(interactionZone, true)
        this.interactionGroup.add(interactionZone)
    }

    private handleInteraction(player: any, interactionObject: any): void {
        const config: InteractionConfig = interactionObject.getData('config')
        if (!config) return

        if (this.currentInteractionObject !== interactionObject) {
            this.currentInteractionObject = interactionObject
            this.showNameTag(config.name, interactionObject.x, interactionObject.y - interactionObject.height / 2 - 30)

            if (config.canInteract) {
                this.showInteractionPrompt(
                    config.tooltip || 'Press E to interact',
                    interactionObject.x,
                    interactionObject.y + interactionObject.height / 2 + 10
                )
            }
        }
    }

    public update(): void {
        this.checkInteractionOverlap()

        if (Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
            this.handleInteractionInput()
        }
    }

    public handlePointerPress(pointer: Phaser.Input.Pointer): boolean {
        if (!this.currentInteractionObject) return true

        const config: InteractionConfig = this.currentInteractionObject.getData('config')
        if (!config?.canInteract) return true

        const objectBounds = this.currentInteractionObject.getBounds()
        if (objectBounds.contains(pointer.worldX, pointer.worldY)) {
            this.performInteraction(config.type)
            return false // Block movement
        }

        return true // Allow movement
    }

    private handleInteractionInput(): void {
        if (!this.currentInteractionObject) return

        const config: InteractionConfig = this.currentInteractionObject.getData('config')
        if (config?.canInteract) {
            this.performInteraction(config.type)
        }
    }

    private showNameTag(name: string, x: number, y: number): void {
        this.nameTagText.setText(name)
        let tagX = x - this.nameTagText.width / 2
        let tagY = y

        const minX = 10
        const maxX = this.scene.scale.width - this.nameTagText.width - 10
        tagX = Phaser.Math.Clamp(tagX, minX, maxX)

        const minY = 10
        if (tagY < minY) {
            tagY = y + 60
        }

        this.nameTagText.setPosition(tagX, tagY)
        this.nameTagText.setVisible(true)
    }

    private showInteractionPrompt(text: string, x: number, y: number): void {
        this.interactionPrompt.setText(text)
        let promptX = x - this.interactionPrompt.width / 2
        let promptY = y

        const minX = 10
        const maxX = this.scene.scale.width - this.interactionPrompt.width - 10
        promptX = Phaser.Math.Clamp(promptX, minX, maxX)

        const maxY = this.scene.scale.height - 30
        if (promptY > maxY) {
            promptY = y - 80
        }

        this.interactionPrompt.setPosition(promptX, promptY)
        this.interactionPrompt.setVisible(true)
    }

    private hideNameTag(): void {
        this.nameTagText.setVisible(false)
        this.interactionPrompt.setVisible(false)
        this.currentInteractionObject = null
    }

    private checkInteractionOverlap(): void {
        if (!this.currentInteractionObject || !this.scene.player) return

        const playerBounds = this.scene.player.getBounds()
        const objectBounds = this.currentInteractionObject.getBounds()

        if (!Phaser.Geom.Rectangle.Overlaps(playerBounds, objectBounds)) {
            this.hideNameTag()
        }
    }

    private performInteraction(type: string, data?: any): void {
        interactionRegistry.execute(type, this.scene, data)
    }
}