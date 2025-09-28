import { Scene } from './Scene'
import type { MapConfig } from '@/types'

export class Classroom extends Scene {
    private static readonly CONFIG: MapConfig = {
        name: 'classroom',
        tilemapPath: '/assets/tilemaps/Classroom.json',
        tilesets: [
            { name: 'Room_Builder_free_32x32', imagePath: '/assets/tilemaps/Room_Builder_free_32x32.png', key: 'roomBuilder' },
            { name: 'Interiors_free_32x32', imagePath: '/assets/tilemaps/Interiors_free_32x32.png', key: 'interiors' }
        ],
        layers: [
            { name: 'Floor', tilesetKey: 'roomBuilder' },
            { name: 'Horizontal Walls', tilesetKey: 'roomBuilder' },
            { name: 'Vertical Walls', tilesetKey: 'roomBuilder' },
            { name: 'Shadows', tilesetKey: 'roomBuilder' },
            { name: 'Tables', tilesetKey: 'interiors' },
            { name: 'Chairs', tilesetKey: 'interiors' },
            { name: 'Chairs Left', tilesetKey: 'interiors' },
            { name: 'Chairs Right', tilesetKey: 'interiors' },
            { name: 'Decorations', tilesetKey: 'interiors' },
            { name: 'Doors', tilesetKey: 'interiors' }
        ]
    }

    constructor() {
        super('ClassroomScene', Classroom.CONFIG)
    }

    create(): void {
        super.create()
    }
}