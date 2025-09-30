'use client'
import dynamic from 'next/dynamic'
import {useState, useEffect} from 'react'

const GameComponent = dynamic(() => import('../../components/GameComponent'), {
    ssr: false,
    loading: () => null,
})

function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(true)

    useEffect(() => {
        const iOS =
            /iPad|iPhone|iPod/.test(navigator.userAgent) &&
            !(window as any).MSStream
        setIsIOS(iOS)

        // check if running as PWA
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true || // iOS specific
            document.referrer.includes('android-app://') // Android

        setIsStandalone(standalone)

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // hide after 5 seconds on iOS
        if (iOS && !standalone) {
            const timer = setTimeout(() => {
                setShowPrompt(false)
            }, 5000)

            return () => {
                clearTimeout(timer)
                window.removeEventListener('beforeinstallprompt', handler)
            }
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return
        }

        deferredPrompt.prompt()
        const {outcome} = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setDeferredPrompt(null)
        }
    }

    if (isStandalone || (!deferredPrompt && !isIOS) || !showPrompt) {
        return null
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                maxWidth: '250px',
            }}>
            {!isIOS && deferredPrompt && (
                <button
                    onClick={handleInstallClick}
                    style={{
                        background: '#000',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                    }}>
                    Install App
                </button>
            )}
            {isIOS && (
                <div style={{fontSize: '13px', lineHeight: '1.4'}}>
                    <button
                        onClick={() => setShowPrompt(false)}
                        style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '4px',
                            lineHeight: '1',
                        }}>
                        ×
                    </button>
                    <strong style={{display: 'block', marginBottom: '8px'}}>
                        Install LevelUpEDU
                    </strong>
                    <p style={{margin: 0}}>
                        1. Tap the Share button
                        <svg
                            style={{
                                width: '16px',
                                height: '16px',
                                verticalAlign: 'middle',
                                margin: '0 2px',
                            }}
                            fill="currentColor"
                            viewBox="0 0 24 24">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                        </svg>
                        <br />
                        2. Select "Add to Home Screen"
                    </p>
                </div>
            )}
        </div>
    )
}

export default function GamePage() {
    return (
        <div>
            <InstallPrompt />
            <GameComponent />
        </div>
    )
}
