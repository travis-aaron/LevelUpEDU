import {db} from './index'
import {
    student,
    instructor,
    quest,
    submission,
    transaction,
    reward,
    redemption,
} from './schema'

import type {
    Student,
    Instructor,
    Quest,
    Submission,
    Transaction,
    Reward,
    Redemption,
} from '@/types/db'

import {eq} from 'drizzle-orm'

export async function findStudentByEmail(
    email: string
): Promise<Student | null> {
    const result = await db
        .select()
        .from(student)
        .where(eq(student.email, email))
        .limit(1)

    return result[0] ?? null
}

export async function findInstructorByEmail(
    email: string
): Promise<Instructor | null> {
    const result = await db
        .select()
        .from(instructor)
        .where(eq(instructor.email, email))
        .limit(1)

    return result[0] ?? null
}
