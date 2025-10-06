import {db} from '../index'
import {submission, transaction} from '../schema'

import type {Quest, Submission, Transaction} from '@/types/db'

import {getQuestsByCourse, getQuestById, createTransaction} from '@/db'

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

export async function getSubmissionById(
    submissionId: number
): Promise<Submission | null> {
    const result = await db
        .select()
        .from(submission)
        .where(eq(submission.id, submissionId))
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

export async function verifySubmission(
    submissionId: number,
    instructorEmail: string,
    approved: boolean
): Promise<{
    submission: Submission
    transaction: Transaction | null
}> {
    // retrieve the submission and quest details
    const currentSubmission = await getSubmissionById(submissionId)
    if (!currentSubmission) {
        throw new Error('Submission not found')
    }
    const questData = await getQuestById(currentSubmission.questId)
    if (!questData) throw new Error('Quest not found')

    // update the submission status
    const updatedSubmission = await db
        .update(submission)
        .set({
            status: approved ? 'approved' : 'rejected',
            verifiedBy: instructorEmail,
            verifiedDate: new Date(),
        })
        .where(eq(submission.id, submissionId))
        .returning()

    // only update points if the submission is approved
    let transactionResult = null
    if (approved) {
        transactionResult = await createTransaction({
            email: currentSubmission.studentId,
            points: questData.points,
            submissionId: submissionId,
        })
    }

    return {
        submission: updatedSubmission[0],
        transaction: transactionResult,
    }
}

export async function getQuestsForStudent(
    studentEmail: string,
    courseId: number
): Promise<Quest[]> {
    const allQuests = await getQuestsByCourse(courseId)

    // get student submissions
    const submissions = await db
        .select()
        .from(submission)
        .where(eq(submission.studentId, studentEmail))

    const submittedQuestIds = new Set(submissions.map((s) => s.questId))

    // filter out quests where the student has submitted already
    return allQuests.filter((q) => !submittedQuestIds.has(q.id))
}
