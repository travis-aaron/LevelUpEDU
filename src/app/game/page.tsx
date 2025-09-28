'use client'
import dynamic from 'next/dynamic'

const GameComponent = dynamic(
    () => import('../../components/GameComponent'),
    {
        ssr: false,
        loading: () => null
    }
)

export default function GamePage() {
    return (
        <div>
            <GameComponent />
        </div>
    )
}