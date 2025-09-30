export function addPulseEffect(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Image,
    tintColor: number = 0xffffc0,
    alphaFrom: number = 0.6,
    alphaTo: number = 1,
    duration: number = 700
): Phaser.Tweens.Tween {
    sprite.setTint(tintColor)
    sprite.setAlpha(alphaFrom)

    return scene.tweens.add({
        targets: sprite,
        alpha: {from: alphaFrom, to: alphaTo},
        duration: duration,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
    })
}
