import {interactionRegistry} from './interactionRegistry'

interactionRegistry.register('chalkboard', (scene, _data?) => {
    scene.interactionHandler.blockMovement()
    const screenWidth = scene.scale.width
    const screenHeight = scene.scale.height
    const interfaceWidth = screenWidth * 0.8
    const interfaceHeight = screenHeight * 0.8
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const escKey = scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.ESC
    )
    const qKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q)

    const overlay = scene.add.rectangle(
        centerX,
        centerY,
        screenWidth,
        screenHeight,
        0x000000,
        0.7
    )
    overlay.setDepth(3000)

    const border = scene.add.rectangle(
        centerX,
        centerY,
        interfaceWidth + 16,
        interfaceHeight + 16,
        0x8b4513
    )
    border.setDepth(3000)

    const chalkboardBg = scene.add.rectangle(
        centerX,
        centerY,
        interfaceWidth,
        interfaceHeight,
        0x2d5016
    )
    chalkboardBg.setDepth(3001)

    const chalkboardText = scene.add
        .text(centerX, centerY - 30, 'Welcome to the platform', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(3002)

    const closeButton = scene.add
        .text(
            centerX,
            centerY + interfaceHeight / 2 - 60,
            'Click anywhere, press Q or ESC to close',
            {
                fontSize: '24px',
                color: '#cccccc',
                fontFamily: 'Arial, sans-serif',
                align: 'center',
            }
        )
        .setOrigin(0.5)
        .setDepth(3002)

    const elements = [
        overlay,
        border,
        chalkboardBg,
        chalkboardText,
        closeButton,
    ]

    const closeInterface = () => {
        elements.forEach((el) => el.destroy())
        escKey.off('down', closeInterface)
        qKey.off('down', closeInterface)
        scene.interactionHandler.unblockMovement()
    }

    overlay.setInteractive()
    overlay.on('pointerdown', closeInterface)

    escKey.on('down', closeInterface)
    qKey.on('down', closeInterface)
})
