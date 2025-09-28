import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
    request: NextRequest,
    { params }: { params: { mapId: string } }
) {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'maps', `${params.mapId}.json`)
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const mapData = JSON.parse(fileContents)

        return NextResponse.json(mapData)
    } catch (error) {
        return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    }
}