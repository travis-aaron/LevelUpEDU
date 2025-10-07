import {interactionRegistry} from './interactionRegistry'

interactionRegistry.register('chalkboard', async (scene, _data?) => {
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
    const upKey = scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.UP
    )
    const downKey = scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.DOWN
    )
    const wKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    const sKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    const enterKey = scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER
    )
    const eKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)

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

    // Prevent clicks on the border from reaching the overlay (treat border as inside)
    border.setInteractive()
    border.on(
        'pointerdown',
        (
            _pointer: Phaser.Input.Pointer,
            _localX: number,
            _localY: number,
            event: any
        ) => {
            // stopPropagation prevents the overlay's pointerdown from firing
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation()
            }
        }
    )

    const chalkboardBg = scene.add.rectangle(
        centerX,
        centerY,
        interfaceWidth,
        interfaceHeight,
        0x2d5016
    )
    chalkboardBg.setDepth(3001)

    // Prevent clicks on the chalkboard area from reaching the overlay
    chalkboardBg.setInteractive()
    chalkboardBg.on(
        'pointerdown',
        (
            _pointer: Phaser.Input.Pointer,
            _localX: number,
            _localY: number,
            event: any
        ) => {
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation()
            }
        }
    )

    // ----- Chalkboard content: title + quest list -----
    // move title more to the left and give more vertical spacing
    const titleText = scene.add
        .text(
            centerX - interfaceWidth / 2 + 24,
            centerY - interfaceHeight / 2 + 40,
            'Quests for <course name>',
            {
                fontSize: '36px',
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                align: 'left',
            }
        )
        .setOrigin(0, 0.5)
        .setDepth(3002)

    // Load quests from server. If the server returns no quests, fall back to an empty list.
    let quests: {title: string; points: number}[] = []
    let persisted: any = null
    try {
        const res = await fetch('/api/quests')
        if (res.ok) {
            persisted = await res.json()
        } else {
            console.warn('Failed to load persisted quests', res.status)
        }
    } catch (err) {
        console.warn('Error fetching persisted quests', err)
    }

    if (
        persisted &&
        Array.isArray(persisted.quests) &&
        persisted.quests.length > 0
    ) {
        // Use persisted titles/points when available
        quests = persisted.quests.map((q: any, idx: number) => ({
            title: q.title ?? `Quest ${idx + 1}`,
            points: typeof q.points === 'number' ? q.points : 0,
        }))
    }

    // place the quest list at the leftmost inside the chalkboard
    const padding = 36
    const listStartX = centerX - interfaceWidth / 2 + padding
    // increase space between title and list
    const listStartY = centerY - interfaceHeight / 2 + 140
    // Done? column should sit just inside the right edge of the chalkboard (moved slightly left)
    const doneX = centerX + interfaceWidth / 2 - padding - 20
    const rowSpacing = 70
    // selector size and X (declared early so tick marks can use them)
    const selectorSize = 28
    const selectorX = doneX

    // Collect all created elements so we can destroy them on close.
    // Declared early so helpers can push into it (e.g. empty message path).
    const elements: Phaser.GameObjects.GameObject[] = []

    const questTexts: Phaser.GameObjects.Text[] = []
    const doneMarks: Phaser.GameObjects.Text[] = []
    const doneStates: boolean[] = new Array(quests.length).fill(false)

    // If persisted data included done flags, initialize doneStates
    if (persisted && Array.isArray(persisted.quests)) {
        for (
            let i = 0;
            i < Math.min(quests.length, persisted.quests.length);
            i++
        ) {
            doneStates[i] = !!persisted.quests[i].done
        }
    }
    const rowHitAreas: Phaser.GameObjects.Rectangle[] = []

    // helper to ellipsize a text object until it fits within maxWidth
    const ellipsizeToFit = (
        textObj: Phaser.GameObjects.Text,
        full: string,
        maxWidth: number
    ) => {
        textObj.setText(full)
        if (textObj.width <= maxWidth) return
        let trimmed = full
        while (trimmed.length > 0 && textObj.width > maxWidth) {
            trimmed = trimmed.slice(0, -1)
            textObj.setText(trimmed + '...')
        }
    }

    // If there are no quests, show a friendly message instead of crashing
    if (quests.length === 0) {
        const emptyMsg = scene.add
            .text(centerX, centerY, 'No quests available', {
                fontSize: '28px',
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                align: 'center',
            })
            .setOrigin(0.5, 0.5)
            .setDepth(3002)
        elements.push(emptyMsg)
    } else {
        quests.forEach((q, i) => {
            const y = listStartY + i * rowSpacing
            const combined = `${i + 1}. ${q.title}   (${q.points}pts)`
            const qt = scene.add
                .text(listStartX, y, combined, {
                    fontSize: '28px',
                    color: '#ffffff',
                    fontFamily: 'Arial, sans-serif',
                    align: 'left',
                })
                .setOrigin(0, 0.5)
                .setDepth(3002)

            // ensure it doesn't overlap the Done? column
            const maxTextRight = doneX - 40 // leave space for selector and margin
            ellipsizeToFit(qt, combined, maxTextRight - qt.x)

            // make quest text interactive: hover to select, click to toggle done
            qt.setInteractive({cursor: 'pointer'})
            qt.on('pointerover', () => {
                selectedIndex = i
                selector.setY(listStartY + selectedIndex * rowSpacing)
                updateSelectorVisuals()
            })
            qt.on(
                'pointerdown',
                (
                    _pointer: Phaser.Input.Pointer,
                    _localX: number,
                    _localY: number,
                    event: any
                ) => {
                    // stop propagation to prevent the overlay from also handling this click
                    if (event && typeof event.stopPropagation === 'function') {
                        event.stopPropagation()
                    }
                    selectedIndex = i
                    updateSelectorVisuals()
                    toggleDoneAt(selectedIndex)
                }
            )

            questTexts.push(qt)

            // create an invisible hit area spanning from quest text to just before Done? column
            const hitX = listStartX
            // extend hit area fully into the Done? column (leave small margin from right edge)
            const hitWidth = Math.max(doneX + 24 - listStartX, 120)
            const hit = scene.add.rectangle(
                hitX + hitWidth / 2,
                y,
                hitWidth,
                rowSpacing * 0.9,
                0x000000,
                0
            )
            hit.setInteractive({cursor: 'pointer'})
            hit.setDepth(3001)
            hit.on('pointerover', () => {
                selectedIndex = i
                selector.setY(listStartY + selectedIndex * rowSpacing)
                updateSelectorVisuals()
            })
            hit.on(
                'pointerdown',
                (
                    _pointer: Phaser.Input.Pointer,
                    _localX: number,
                    _localY: number,
                    event: any
                ) => {
                    if (event && typeof event.stopPropagation === 'function') {
                        event.stopPropagation()
                    }
                    selectedIndex = i
                    updateSelectorVisuals()
                    toggleDoneAt(selectedIndex)
                }
            )

            rowHitAreas.push(hit)

            // create a tick mark text for the Done? column (initially hidden)
            const tick = scene.add
                .text(selectorX, y, '✓', {
                    fontSize: `${Math.round(selectorSize * 1.6)}px`,
                    color: '#ffff00',
                    fontFamily: 'Arial, sans-serif',
                    align: 'center',
                })
                .setOrigin(0.5, 0.5)
                .setDepth(3004)
                .setVisible(!!doneStates[i])

            doneMarks.push(tick)
        })
    }

    // 'Done?' column label
    const doneLabel = scene.add
        .text(doneX, listStartY - rowSpacing / 2, 'Done?', {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            align: 'center',
        })
        .setOrigin(0.5, 0.5)
        .setDepth(3002)

    // Yellow selector square
    let selectedIndex = 0
    const selector = scene.add.rectangle(
        selectorX,
        listStartY + selectedIndex * rowSpacing,
        selectorSize,
        selectorSize,
        0xffff00
    )
    // make selector unfilled (outline only)
    if (typeof (selector as any).setFillStyle === 'function') {
        ;(selector as any).setFillStyle(0xffff00, 0)
    } else {
        // fallback: set fill alpha to 0 if direct API is not available
        ;(selector as any).fillAlpha = 0
    }
    selector.setStrokeStyle(3, 0xffff00)
    selector.setDepth(3003)

    // Add the core created elements to the shared elements array for cleanup
    elements.push(
        overlay,
        border,
        chalkboardBg,
        titleText,
        ...questTexts,
        ...doneMarks,
        ...rowHitAreas,
        doneLabel,
        selector
    )

    // selector visual update (highlight selected quest)
    const updateSelectorVisuals = () => {
        questTexts.forEach((qt, idx) => {
            qt.setColor(idx === selectedIndex ? '#ffff00' : '#ffffff')
        })
    }

    const moveSelector = (delta: number) => {
        const prev = selectedIndex
        selectedIndex = Phaser.Math.Clamp(
            selectedIndex + delta,
            0,
            quests.length - 1
        )
        if (selectedIndex !== prev) {
            selector.setY(listStartY + selectedIndex * rowSpacing)
            updateSelectorVisuals()
        }
    }

    const onUp = () => moveSelector(-1)
    const onDown = () => moveSelector(1)

    // Attach navigation keys
    upKey.on('down', onUp)
    wKey.on('down', onUp)
    downKey.on('down', onDown)
    sKey.on('down', onDown)

    // toggle done state for a given index
    const persistToggle = async (index: number, value: boolean) => {
        try {
            const res = await fetch('/api/quests', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({index, done: value}),
            })
            if (!res.ok) throw new Error('Failed to persist')
            return true
        } catch (err) {
            console.error('persistToggle error', err)
            return false
        }
    }

    const toggleDoneAt = (index: number) => {
        const newVal = !doneStates[index]
        // optimistic UI
        doneStates[index] = newVal
        const mark = doneMarks[index]
        if (mark) {
            mark.setVisible(newVal)
            if (newVal) {
                scene.tweens.add({
                    targets: mark,
                    scale: {from: 0.6, to: 1},
                    ease: 'Back.Out',
                    duration: 220,
                })
            }
        }

        // persist in background, revert on failure
        persistToggle(index, newVal).then((ok) => {
            if (!ok) {
                doneStates[index] = !newVal
                if (mark) mark.setVisible(!newVal)
            }
        })
    }

    // toggle done for currently selected (used by Enter/E)
    const toggleDone = () => toggleDoneAt(selectedIndex)

    enterKey.on('down', toggleDone)
    eKey.on('down', toggleDone)

    updateSelectorVisuals()

    const closeInterface = () => {
        // remove listeners
        escKey.off('down', closeInterface)
        qKey.off('down', closeInterface)
        enterKey.off('down', toggleDone)
        eKey.off('down', toggleDone)
        upKey.off('down', onUp)
        wKey.off('down', onUp)
        downKey.off('down', onDown)
        sKey.off('down', onDown)

        // destroy all created objects
        elements.forEach((el) => el.destroy())

        // unblock movement
        scene.interactionHandler.unblockMovement()
    }

    overlay.setInteractive()
    // Only close if the user clicks outside of the chalkboard area (treat border as inside)
    overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const bounds = border.getBounds()
        // pointer.x / pointer.y are canvas coordinates; check against border bounds
        if (!bounds.contains(pointer.x, pointer.y)) {
            closeInterface()
        }
    })

    escKey.on('down', closeInterface)
    qKey.on('down', closeInterface)
})
