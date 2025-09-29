import type { MapConfig, GameScene, TiledObjectLayer, MovementState } from '@/types'

interface SpriteManifest {
    sprites: string[]
}

export class Scene extends Phaser.Scene implements GameScene {
    protected sceneName: string

    // map objects
    protected map: Phaser.Tilemaps.Tilemap
    protected mapConfig: MapConfig
    protected spriteObjects: Set<string> = new Set()
    public collisionGroup!: Phaser.Physics.Arcade.StaticGroup

    public player!: Phaser.Physics.Arcade.Sprite

    // input objects
    public cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    protected movementState!: MovementState

    // key is the name of the map, ie "classroom"
    constructor(key: string, mapConfig: MapConfig) {
        super({ key })
        this.mapConfig = mapConfig
        this.sceneName = key
    }

    preload(): void {
        // get the list of sprite objects for this scene
        const manifestKey = `${this.sceneName}-sprites`
        this.load.json(manifestKey, `/assets/sprites/${this.sceneName}/manifest.json`)

        this.load.on(`filecomplete-json-${manifestKey}`, () => {
            const manifest: SpriteManifest = this.cache.json.get(manifestKey)

            // load the objects
            if (manifest && manifest.sprites) {
                manifest.sprites.forEach(spriteName => {
                    const key = `${this.sceneName}-${spriteName}`
                    this.load.image(key, `/assets/sprites/${this.sceneName}/${spriteName}.png`)
                    this.spriteObjects.add(spriteName)
                })

                this.load.start()
            }
        })

        // tilesets
        this.mapConfig.tilesets.forEach(tileset => {
            this.load.image(tileset.key, tileset.imagePath)
        })

        // tilemap
        this.load.tilemapTiledJSON('map', this.mapConfig.tilemapPath)

        // player
        this.load.aseprite('bob', '/assets/sprites/Bob_run_16x16-sheet.png', '/assets/sprites/Bob_run_16x16.json')

        this.load.on('complete', () => {
            this.mapConfig.tilesets.forEach(tileset => {
                this.textures.get(tileset.key).setFilter(Phaser.Textures.FilterMode.NEAREST)
            })
        })
    }

    create(): void {
        this.createMap()
        this.createPlayer()
        this.createCollisions()
        this.createInteractables()
        this.setupInput()
    }



    protected createMap(): void {
        this.map = this.add.tilemap('map')

        // populate tilesets
        const tilesets: Record<string, Phaser.Tilemaps.Tileset> = {}
        this.mapConfig.tilesets.forEach(tilesetConfig => {
            const tileset = this.map.addTilesetImage(tilesetConfig.name, tilesetConfig.key)
            if (tileset) {
                tilesets[tilesetConfig.key] = tileset
            }
        })

        // add each layer
        this.mapConfig.layers.forEach(layerConfig => {
            const tileset = tilesets[layerConfig.tilesetKey]
            if (tileset) {
                this.map.createLayer(layerConfig.name, tileset)
            }
        })

    }

    protected createPlayer(): void {
        this.anims.createFromAseprite('bob')
        this.player = this.physics.add.sprite(400, 300, 'bob')
        this.player.setScale(2)
    }
    protected createInteractables(): void {
        const interactableLayer = this.map.getObjectLayer('Interactable') as TiledObjectLayer | null

        console.log(interactableLayer)


        if (interactableLayer) {
            interactableLayer.objects.forEach(obj => {
                console.log(obj.name)
                console.log(obj.x, obj.y)
            })
        }
    }

    protected createCollisions(): void {
        const collisionLayer = this.map.getObjectLayer('Collisions') as TiledObjectLayer | null

        if (collisionLayer) {
            this.collisionGroup = this.physics.add.staticGroup()

            collisionLayer.objects.forEach(obj => {
                if (obj.width > 0 && obj.height > 0 && obj.visible) {
                    const collisionRect = this.add.rectangle(
                        obj.x + obj.width / 2,
                        obj.y + obj.height / 2,
                        obj.width,
                        obj.height,
                        0xff0000, // bright red - useful for debug
                        0 // invisible by default
                    )
                    this.physics.add.existing(collisionRect, true)
                    this.collisionGroup.add(collisionRect)
                }
            })

            this.physics.add.collider(this.player, this.collisionGroup)
        }
    }

    protected setupInput(): void {
        this.cursors = this.input.keyboard!.createCursorKeys()

        this.movementState = {
            left: false,
            right: false,
            up: false,
            down: false
        }

        this.input.on('pointerdown', this.handlePointerPress, this)
        this.input.on('pointerup', this.handlePointerRelease, this)
    }

    protected handleMovement(direction: 'up' | 'down' | 'left' | 'right', active: boolean): void {
        this.movementState[direction] = active
    }
    protected handlePointerPress(pointer: Phaser.Input.Pointer): void {
        const playerX = this.player.x
        const playerY = this.player.y
        const deltaX = pointer.x - playerX
        const deltaY = pointer.y - playerY

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal movement
            if (deltaX < 0) {
                this.handleMovement('left', true)
            } else {
                this.handleMovement('right', true)
            }
        } else {
            // Vertical movement
            if (deltaY < 0) {
                this.handleMovement('up', true)
            } else {
                this.handleMovement('down', true)
            }
        }
    }

    protected handlePointerRelease(): void {
        this.handleMovement('left', false)
        this.handleMovement('right', false)
        this.handleMovement('up', false)
        this.handleMovement('down', false)
    }

    update(): void {
        if (!this.player || !this.cursors) return

        // typescript assumes the player body is static - cast it to avoid this
        const body = this.player.body as Phaser.Physics.Arcade.Body
        let moving = false

        // handles both keyboard and mobile touch (theoretically)
        const leftPressed = this.cursors.left.isDown || this.movementState.left
        const rightPressed = this.cursors.right.isDown || this.movementState.right
        const upPressed = this.cursors.up.isDown || this.movementState.up
        const downPressed = this.cursors.down.isDown || this.movementState.down

        if (leftPressed) {
            body.setVelocityX(-100)
            this.player.play('walk_left', true)
            moving = true
        } else if (rightPressed) {
            body.setVelocityX(100)
            this.player.play('walk_right', true)
            moving = true
        } else {
            body.setVelocityX(0)
        }

        if (upPressed) {
            body.setVelocityY(-100)
            this.player.play('walk_up', true)
            moving = true
        } else if (downPressed) {
            body.setVelocityY(100)
            this.player.play('walk_down', true)
            moving = true
        } else {
            body.setVelocityY(0)
        }

        if (!moving) {
            this.player.stop()
        }
    }
}