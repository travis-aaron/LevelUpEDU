import {
    pgTable,
    varchar,
    integer,
    text,
    timestamp,
    serial,
} from 'drizzle-orm/pg-core'

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
    id: serial('course_id').primaryKey().unique(),
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
    id: serial('quest_id').primaryKey().unique(),
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

/* helper functions */

function generateCourseCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}
