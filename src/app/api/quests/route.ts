import {NextResponse} from 'next/server'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'src', 'data', 'quests.json')

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const {index, done} = body
        if (typeof index !== 'number' || typeof done !== 'boolean') {
            return NextResponse.json({error: 'Invalid payload'}, {status: 400})
        }

        let data = {quests: [] as any[]}
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, 'utf8')
            data = JSON.parse(raw)
        }

        if (!Array.isArray(data.quests)) data.quests = []

        // ensure index exists
        if (!data.quests[index]) {
            data.quests[index] = data.quests[index] || {
                title: `Quest ${index + 1}`,
                points: 0,
                done: false,
            }
        }

        data.quests[index].done = done

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')

        return NextResponse.json({ok: true, quests: data.quests})
    } catch (err) {
        return NextResponse.json({error: String(err)}, {status: 500})
    }
}

export async function GET() {
    try {
        if (!fs.existsSync(dataPath)) {
            return NextResponse.json({quests: []})
        }
        const raw = fs.readFileSync(dataPath, 'utf8')
        const data = JSON.parse(raw)
        return NextResponse.json(data)
    } catch (err) {
        return NextResponse.json({error: String(err)}, {status: 500})
    }
}
