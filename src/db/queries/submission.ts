import {db} from '../index'
import {submission} from '../schema'

import type {Submission} from '@/types/db'

import {eq} from 'drizzle-orm'

export async function createSubmission(data: {
    email: string
    questId: number
}): Promise<Submission> {
    const result = await db
        .insert(submission)
        .values({
            studentId: data.email,
            questId: data.questId,
            submissionDate: new Date(),
            status: 'pending',
        })
        .returning()

    return result[0]
}

export async function getPendingSubmissions(): Promise<Submission[]> {
    return db.select().from(submission).where(eq(submission.status, 'pending'))
}

export async function getSubmissionsByStudent(
    email: string
): Promise<Submission[]> {
    return db.select().from(submission).where(eq(submission.studentId, email))
}
