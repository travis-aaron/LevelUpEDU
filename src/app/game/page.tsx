'use client'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const GameComponent = dynamic(
    () => import('../../components/GameComponent'),
    {
        ssr: false,
        loading: () => null
    }
)

function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        setIsIOS(
            /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        )

        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handler)

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return
        }

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setDeferredPrompt(null)
        }
    }

    if (isStandalone) {
        return null
    }

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: 'white',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            {!isIOS && deferredPrompt && (
                <button onClick={handleInstallClick}>Install App</button>
            )}
            {isIOS && (
                <p style={{ margin: 0, fontSize: '12px' }}>
                    Tap share <span role="img" aria-label="share icon">⎋</span> then "Add to Home Screen"
                </p>
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