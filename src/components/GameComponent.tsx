'use client'

import {useEffect, useRef, useState} from 'react'

/*
 *         ******************
 *         Flow of execution:
 *         ******************
 *
 * GameComponent is mounted (once Browser is ready, DOM exists etc..)
 * *******************************************************************
 *                 ||
 *                 \/
 * Game instance is created (scene is imported, gameConfig is set..)
 * *****************************************************************
 *                 ||
 *                 \/
 * Phaser is initialized (and imports [starting Scene])
 * ****************************************************
 *                 ||
 *                 \/
 * [starting Scene] constructor runs
 * *********************************************
 *     - Calls Scene.ts constructor with its specific CONFIG options
 *     - [starting Scene] preload() runs and fetches API data and assets
 *          - Next.js route handler is called in: src/app/maps/[mapId]/
 *              - mapId is a string (such as "classroom")
 *              - Tiled's map JSON file is fetched from route handler at /src/data/maps/[mapId]
 *     - [starting Scene] create() runs and calls Scene.ts create() method
 *
 *         ==================
 *         |****Scene.ts****|
 *         ==================
 *     - createMap() - Builds the tilemap from the passed in config and API data
 *     - createPlayer() - Load player and apply physics (to allow movement)
 *     - createCollisions() - Loads the maps "Collisions" object layer and converts to Phaser colliders
 *     - setupInput() - Player controls are set up
 *     - update() <- main game loop, refreshes constantly
 *     **************************************************
 *                 ||
 *                 \/
 * React component unmounts (user navigates away, tab closes, or player quits through in game menu (later))
 * ******************************************************
 *                 ||
 *                 \/
 * isClient changes to false -> gameInstance is cleaned up
 *
 */

export default function GameComponent() {
    // create a placeholder reference, the div won't exist just yet
    const gameRef = useRef<HTMLDivElement>(null)

    const [isClient, setIsClient] = useState(false)

    // sets the client to true once component mounts in browser
    // only runs client side
    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient || !gameRef.current) return // don't try to render unless the DOM is ready

        let gameInstance: any = null

        const initGame = async () => {
            const Phaser = await import('phaser')

            // default scene to load
            const {Classroom} = await import('@/scenes/Classroom')

            // check device
            const isMobile =
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent
                )
            const scaleMode = isMobile ? Phaser.Scale.FIT : Phaser.Scale.FIT

            const config = {
                type: Phaser.WEBGL,
                parent: gameRef.current,
                backgroundColor: '#1a1a24',
                render: {
                    pixelArt: true,
                    antialias: false,
                },
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    width: 800,
                    height: 600,
                    parent: gameRef.current,
                },
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: {y: 0, x: 0},
                        debug: false,
                    },
                },
                scene: Classroom,
            }

            gameInstance = new Phaser.Game(config)
        }

        initGame()

        // cleanup
        return () => {
            if (gameInstance) {
                gameInstance.destroy(true) // destroy the game and free memory
            }
        }
    }, [isClient]) // runs when isClient changes

    if (!isClient) {
        return null
    }

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1a1a24',
                margin: 0,
                padding: 0,
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
            }}>
            <div
                ref={gameRef}
                style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '100vw',
                    maxHeight: '100vh',
                }}
            />
        </div>
    )
}
