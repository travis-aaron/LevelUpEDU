import {interactionRegistry} from './interactionRegistry'

interactionRegistry.register('keypad', (scene, _data?) => {
    scene.interactionHandler.blockMovement()

    // Create overlay
    const screenWidth = scene.scale.width
    const screenHeight = scene.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const overlay = scene.add.rectangle(
        centerX,
        centerY,
        screenWidth,
        screenHeight,
        0x000000,
        0.8
    )
    overlay.setDepth(3000)

    // Create container for the keypad
    const keypadContainer = scene.add.container(centerX, centerY)
    keypadContainer.setDepth(3001)

    // Create phone-like background
    const phoneBg = scene.add.rectangle(0, 0, 380, 500, 0x2a2a2a)
    phoneBg.setStrokeStyle(2, 0x1a1a1a)

    // Create screen area
    const screenArea = scene.add.rectangle(0, -150, 330, 200, 0x0a0a0a)
    screenArea.setStrokeStyle(1, 0x000000)

    // Create display
    const displayBg = scene.add.rectangle(0, -100, 300, 60, 0x000000)
    displayBg.setStrokeStyle(1, 0x0a0a0a)

    // Add title
    const title = scene.add
        .text(0, -180, 'Enter Course Code', {
            fontSize: '18px',
            color: '#4a9eff',
            fontFamily: 'Arial, sans-serif',
            align: 'center',
        })
        .setOrigin(0.5)

    // Add display text
    const displayText = scene.add
        .text(0, -100, '---−---', {
            fontSize: '32px',
            color: '#0f0',
            fontFamily: 'Courier New, monospace',
            align: 'center',
        })
        .setOrigin(0.5)

    // Create keypad buttons
    const buttons: Phaser.GameObjects.Rectangle[] = []
    const buttonTexts: Phaser.GameObjects.Text[] = []
    const buttonLabels: Phaser.GameObjects.Text[] = []

    const buttonPositions = [
        {x: -80, y: 50, num: '1', letters: ''},
        {x: 0, y: 50, num: '2', letters: 'ABC'},
        {x: 80, y: 50, num: '3', letters: 'DEF'},
        {x: -80, y: 100, num: '4', letters: 'GHI'},
        {x: 0, y: 100, num: '5', letters: 'JKL'},
        {x: 80, y: 100, num: '6', letters: 'MNO'},
        {x: -80, y: 150, num: '7', letters: 'PQRS'},
        {x: 0, y: 150, num: '8', letters: 'TUV'},
        {x: 80, y: 150, num: '9', letters: 'WXYZ'},
        {x: -80, y: 200, num: 'clear', letters: '✕'},
        {x: 0, y: 200, num: '0', letters: ''},
        {x: 80, y: 200, num: 'delete', letters: '⌫'},
    ]

    buttonPositions.forEach((pos, index) => {
        const button = scene.add.rectangle(pos.x, pos.y, 60, 40, 0x3a3a3a)
        button.setStrokeStyle(1, 0x1a1a1a)
        button.setInteractive()

        const buttonText = scene.add
            .text(pos.x, pos.y - 5, pos.num, {
                fontSize: '20px',
                color: '#fff',
                fontFamily: 'Arial, sans-serif',
                align: 'center',
            })
            .setOrigin(0.5)

        let buttonLabel: Phaser.GameObjects.Text | null = null
        if (pos.letters) {
            buttonLabel = scene.add
                .text(pos.x, pos.y + 8, pos.letters, {
                    fontSize: '8px',
                    color: '#999',
                    fontFamily: 'Arial, sans-serif',
                    align: 'center',
                })
                .setOrigin(0.5)
        }

        buttons.push(button)
        buttonTexts.push(buttonText)
        if (buttonLabel) buttonLabels.push(buttonLabel)

        // Button interactions
        button.on('pointerdown', () => {
            button.setFillStyle(0x2a2a2a)
        })

        button.on('pointerup', () => {
            button.setFillStyle(0x3a3a3a)
            handleKeyPress(pos.num)
        })

        button.on('pointerout', () => {
            button.setFillStyle(0x3a3a3a)
        })
    })

    // Submit button
    const submitButton = scene.add.rectangle(0, 250, 200, 40, 0x2ecc71)
    submitButton.setStrokeStyle(1, 0x145a32)
    submitButton.setInteractive()

    const submitText = scene.add
        .text(0, 250, '✓ Submit', {
            fontSize: '18px',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            align: 'center',
        })
        .setOrigin(0.5)

    submitButton.on('pointerdown', () => {
        submitButton.setFillStyle(0x27ae60)
    })

    submitButton.on('pointerup', () => {
        submitButton.setFillStyle(0x2ecc71)
        handleSubmit()
    })

    submitButton.on('pointerout', () => {
        submitButton.setFillStyle(0x2ecc71)
    })

    // Close button
    const closeButton = scene.add
        .text(150, -180, '✕', {
            fontSize: '24px',
            color: '#ff6b6b',
            fontFamily: 'Arial, sans-serif',
            align: 'center',
        })
        .setOrigin(0.5)
    closeButton.setInteractive()

    // Keyboard support
    const escKey = scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.ESC
    )
    const qKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q)

    let currentInput = ''

    function formatDisplay(input: string) {
        if (!input) return '---−---'
        const padded = input.padEnd(6, '-')
        return padded.slice(0, 3) + '−' + padded.slice(3, 6)
    }

    function updateDisplay() {
        displayText.setText(formatDisplay(currentInput))
    }

    function handleKeyPress(key: string) {
        if (key === 'clear') {
            currentInput = ''
            updateDisplay()
        } else if (key === 'delete') {
            currentInput = currentInput.slice(0, -1)
            updateDisplay()
        } else if (
            key !== 'clear' &&
            key !== 'delete' &&
            currentInput.length < 6
        ) {
            currentInput += key
            updateDisplay()
        }
    }

    function handleSubmit() {
        if (currentInput.length === 6) {
            // Show success message
            const successText = scene.add
                .text(
                    0,
                    0,
                    `Course code entered: ${currentInput.slice(0, 3)}-${currentInput.slice(3, 6)}`,
                    {
                        fontSize: '16px',
                        color: '#0f0',
                        fontFamily: 'Arial, sans-serif',
                        align: 'center',
                    }
                )
                .setOrigin(0.5)
            successText.setDepth(3002)

            // Close after 2 seconds
            scene.time.delayedCall(2000, () => {
                closeInterface()
            })
        } else {
            // Show error message
            const errorText = scene.add
                .text(0, 0, 'Please enter 6 digits', {
                    fontSize: '16px',
                    color: '#ff6b6b',
                    fontFamily: 'Arial, sans-serif',
                    align: 'center',
                })
                .setOrigin(0.5)
            errorText.setDepth(3002)

            // Remove error message after 1 second
            scene.time.delayedCall(1000, () => {
                errorText.destroy()
            })
        }
    }

    function closeInterface() {
        overlay.destroy()
        keypadContainer.destroy()
        title.destroy()
        displayText.destroy()
        submitText.destroy()
        closeButton.destroy()

        buttons.forEach((btn) => btn.destroy())
        buttonTexts.forEach((text) => text.destroy())
        buttonLabels.forEach((label) => label.destroy())

        submitButton.destroy()

        escKey.off('down', closeInterface)
        qKey.off('down', closeInterface)
        scene.interactionHandler.unblockMovement()
    }

    closeButton.on('pointerdown', closeInterface)
    escKey.on('down', closeInterface)
    qKey.on('down', closeInterface)
})
