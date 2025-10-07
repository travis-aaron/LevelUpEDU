import {drizzle} from 'drizzle-orm/postgres-js'
import {newDb} from 'pg-mem'
import * as schema from '../src/db/schema'

export async function setupTestDb() {
    const mem = newDb()
    const pgClient = mem.adapters.createPgPromise()
    const db = drizzle(pgClient, {schema})

    return db
}
