import {
    check,
    pgEnum,
    pgTable,
    varchar,
    integer,
    text,
    timestamp,
    serial,
} from 'drizzle-orm/pg-core'
import {sql} from 'drizzle-orm'

/* enums */

export const submissionStatus = pgEnum('submission_status', [
    'pending',
    'approved',
    'rejected',
])

/* User management */

export const student = pgTable('student', {
    email: varchar('email').primaryKey().unique(),
    name: varchar('name').notNull(),
    lastSignin: timestamp('last_signin', {mode: 'date'}),
})

export const instructor = pgTable('instructor', {
    email: varchar('email').primaryKey().unique(),
    name: varchar('name').notNull(),
    lastSignin: timestamp('last_signin', {mode: 'date'}),
})

export const course = pgTable('course', {
    id: serial('id').primaryKey().unique(),
    courseCode: varchar('course_code', {length: 6})
        .notNull()
        .unique()
        .$defaultFn(() => generateCourseCode()),
    title: varchar('title', {length: 63}).notNull(),
    description: text('description'),
    instructorEmail: varchar('instructor_email')
        .references(() => instructor.email)
        .notNull(),
})

export const registration = pgTable('registration', {
    studentId: varchar('student_id')
        .references(() => student.email)
        .notNull(),
    courseId: integer('course_id')
        .references(() => course.id)
        .notNull(),
})

/* Quests & rewards */

export const quest = pgTable('quest', {
    id: serial('id').primaryKey().unique(),
    courseId: integer('course_id')
        .references(() => course.id)
        .notNull(),
    createdBy: varchar('created_by')
        .references(() => instructor.email)
        .notNull(),
    title: varchar('title', {length: 63}).notNull(),
    pointsValue: integer('points_value').notNull(),
    createdDate: timestamp('created_date', {mode: 'date'}).notNull(),
    expirationDate: timestamp('expiration_date', {mode: 'date'}),
})

export const submission = pgTable('submission', {
    id: serial('id').primaryKey().unique(),
    studentId: varchar('student_id')
        .references(() => student.email)
        .notNull(),
    questId: integer('quest_id')
        .references(() => quest.id)
        .notNull(),
    submissionDate: timestamp('submission_date', {mode: 'date'}).notNull(),
    status: submissionStatus('status').notNull().default('pending'),
    verifiedBy: varchar('verified_by').references(() => instructor.email),
    verifiedDate: timestamp('verified_date', {mode: 'date'}),
})

export const redemption = pgTable('redemption', {
    id: serial('id').primaryKey().unique(),
})

export const transaction = pgTable(
    'transaction',
    {
        id: serial('id').primaryKey().unique(),
        studentId: varchar('student_id')
            .references(() => student.email)
            .notNull(),
        pointsValue: integer('points_value').notNull(),
        transactionDate: timestamp('transaction_date', {
            mode: 'date',
        }).notNull(),
        submissionId: integer('submission_id').references(() => submission.id),
        redemptionId: integer('redemption_id').references(() => redemption.id),
    },
    (table) => [
        check(
            // business rule: there must be a way to track where the transaction came from
            'submission_id',
            sql`(${table.submissionId} IS NOT NULL AND ${table.redemptionId} IS NULL) OR
              (${table.submissionId} IS NULL AND ${table.redemptionId} IS NOT NULL)`
        ),
    ]
)

/* helper functions */

function generateCourseCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}
