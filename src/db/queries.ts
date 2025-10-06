import {db} from './index'
import {instructor, quest, submission, transaction} from './schema'

import type {Instructor, Quest, Submission, Transaction} from '@/types/db'

import {and, count, eq, inArray, sum} from 'drizzle-orm'

export async function getInstructorByEmail(
    email: string
): Promise<Instructor | null> {
    const result = await db
        .select()
        .from(instructor)
        .where(eq(instructor.email, email))
        .limit(1)

    return result[0] ?? null
}

export async function getPendingSubmissions(): Promise<Submission[]> {
    return db.select().from(submission).where(eq(submission.status, 'pending'))
}

export async function getSubmissionsByStudent(
    email: string
): Promise<Submission[]> {
    return db.select().from(submission).where(eq(submission.studentId, email))
}

export async function getQuestsByCourse(courseId: number): Promise<Quest[]> {
    return db.select().from(quest).where(eq(quest.courseId, courseId))
}

export async function getQuestById(questId: number): Promise<Quest | null> {
    const result = await db
        .select()
        .from(quest)
        .where(eq(quest.id, questId))
        .limit(1)

    return result[0] ?? null
}

export async function createInstructor(
    email: string,
    name: string
): Promise<Instructor> {
    const result = await db.insert(instructor).values({email, name}).returning()

    return result[0]
}

export async function createTransaction(data: {
    email: string
    points: number
    submissionId?: number
    redemptionId?: number
}): Promise<Transaction> {
    const result = await db
        .insert(transaction)
        .values({
            studentId: data.email,
            points: data.points,
            transactionDate: new Date(),
            submissionId: data.submissionId ?? null,
            redemptionId: data.redemptionId ?? null,
        })
        .returning()

    return result[0]
}

export async function createQuest(data: {
    courseId: number
    createdBy: string
    title: string
    points: number
    expirationDate?: Date
}): Promise<Quest> {
    const result = await db
        .insert(quest)
        .values({
            courseId: data.courseId,
            createdBy: data.createdBy,
            title: data.title,
            points: data.points,
            createdDate: new Date(),
            expirationDate: data.expirationDate ?? null,
        })
        .returning()

    return result[0]
}

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
