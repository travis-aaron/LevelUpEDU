import {type NextRequest, NextResponse} from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
    _request: NextRequest,
    {params}: {params: Promise<{mapId: string}>}
) {
    const {mapId} = await params

    try {
        const filePath = path.join(
            process.cwd(),
            'src',
            'data',
            'maps',
            `${mapId}.json`
        )
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const mapData = JSON.parse(fileContents)

        return NextResponse.json(mapData)
    } catch (error) {
        return NextResponse.json(
            {error: `Map not found: ${error}`},
            {status: 404}
        )
    }
}
