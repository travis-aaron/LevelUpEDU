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

import {and, count, eq, inArray, sum} from 'drizzle-orm'

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

/* use this function for students purchasing - will return null if the reward isn't available */
export async function getRewardIfAvailable(
    rewardId: number
): Promise<Reward | null> {
    const rewardData = await getRewardById(rewardId)
    if (!rewardData || !rewardData.active) return null

    if (rewardData.quantityLimit !== null) {
        // query the redemption table to get a full count of prizes
        const redeemed = await db
            .select({count: count()})
            .from(redemption)
            .where(
                and(
                    eq(redemption.rewardId, rewardId),
                    inArray(redemption.status, ['pending', 'fulfilled'])
                )
            )

        // check the final tally of redeemed prizes vs the quantityLimit
        if (Number(redeemed[0].count) >= rewardData.quantityLimit) {
            return null
        }
    }
    return rewardData
}

/* use to check which rewards a student can get for a given course */
export async function getAvailableRewards(courseId: number): Promise<Reward[]> {
    return db
        .select()
        .from(reward)
        .where(and(eq(reward.courseId, courseId), eq(reward.active, true)))
}

/* get list of all rewards for course */
export async function getRewardsByCourse(courseId: number): Promise<Reward[]> {
    return db.select().from(reward).where(eq(reward.courseId, courseId))
}

/* returns the reward along with quantity information (for display in a shop) */
export async function getRewardStatsById(rewardId: number): Promise<{
    reward: Reward
    limit: number | null
    redeemed: number
    available: number | null
    isAvailable: boolean
}> {
    const rewardData = await db
        .select()
        .from(reward)
        .where(eq(reward.id, rewardId))
        .limit(1)

    if (!rewardData[0]) throw new Error('Reward not found')

    // count the redemptions to determine quantity
    const redeemed = await db
        .select({count: count()})
        .from(redemption)
        .where(
            and(
                eq(redemption.rewardId, rewardId),
                inArray(redemption.status, ['pending', 'fulfilled'])
            )
        )

    const limit = rewardData[0].quantityLimit
    const redeemedCount = Number(redeemed[0].count)

    return {
        reward: rewardData[0],
        limit,
        redeemed: redeemedCount,
        available: limit === null ? null : limit - redeemedCount,
        isAvailable:
            rewardData[0].active && (limit === null || redeemedCount < limit),
    }
}

/* BE CAREFUL - this function will be expensive
 * meant for populating instructor dashboard with both available and unavailable courses */
export async function getRewardsByCourseWithStats(courseId: number): Promise<
    Array<{
        reward: Reward
        redeemed: number
        available: number | null
        isAvailable: boolean
    }>
> {
    const results = await db
        .select({
            reward: reward,
            redemptionCount: count(redemption.id),
        })
        .from(reward)
        .leftJoin(
            //join with redemption table to get the full count
            redemption,
            and(
                eq(redemption.rewardId, reward.id),
                inArray(redemption.status, ['pending', 'fulfilled'])
            )
        )
        .where(eq(reward.courseId, courseId))
        .groupBy(reward.id)

    return results.map((r) => ({
        reward: r.reward,
        redeemed: Number(r.redemptionCount),
        available:
            r.reward.quantityLimit === null ?
                null // unlimited
            :   r.reward.quantityLimit - Number(r.redemptionCount), //quantity left
        isAvailable:
            r.reward.active &&
            (r.reward.quantityLimit === null ||
                Number(r.redemptionCount) < r.reward.quantityLimit),
    }))
}

/* generic helper function for developers*/
export async function getRewardById(rewardId: number): Promise<Reward | null> {
    const result = await db
        .select()
        .from(reward)
        .where(eq(reward.id, rewardId))
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
