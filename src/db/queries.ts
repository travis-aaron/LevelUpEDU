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

import {eq, sum} from 'drizzle-orm'

export async function getStudentByEmail(
    email: string
): Promise<Student | null> {
    const result = await db
        .select()
        .from(student)
        .where(eq(student.email, email))
        .limit(1)

    return result[0] ?? null
}

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

export async function getStudentPoints(email: string): Promise<number> {
    const result = await db
        .select({total: sum(transaction.points)})
        .from(transaction)
        .where(eq(transaction.studentId, email))

    return Number(result[0]?.total ?? 0)
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

export async function createStudent(
    email: string,
    name: string
): Promise<Student> {
    const result = await db.insert(student).values({email, name}).returning()

    return result[0]
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

export async function createReward(data: {
    courseId: number
    name: string
    description?: string
    cost: number
    quantityLimit?: number
    type?: 'unspecified'
    active?: boolean
}): Promise<Reward> {
    const result = await db
        .insert(reward)
        .values({
            courseId: data.courseId,
            createdDate: new Date(),
            name: data.name,
            description: data.description ?? null,
            cost: data.cost,
            quantityLimit: data.quantityLimit ?? null,
            type: data.type ?? 'unspecified',
            active: data.active ?? true,
        })
        .returning()

    return result[0]
}
