import type { Scene } from '@/scenes/Scene'

type InteractionHandler = (scene: Scene, data?: unknown) => void

class InteractionRegistry {
    private handlers: Map<string, InteractionHandler> = new Map()

    register(type: string, handler: InteractionHandler): void {
        this.handlers.set(type, handler)
    }

    execute(type: string, scene: Scene, data?: unknown): void {
        const handler = this.handlers.get(type)
        if (handler) {
            handler(scene, data)
        } else {
            console.warn(`No interaction handler registered for type: ${type}`)
        }
    }

    has(type: string): boolean {
        return this.handlers.has(type)
    }
}

export const interactionRegistry = new InteractionRegistry()