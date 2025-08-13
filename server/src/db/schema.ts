import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const applicationStatusEnum = pgEnum('application_status', [
  'INITIAL_REGISTRATION',
  'DOCUMENT_UPLOAD',
  'SELECTION', 
  'ANNOUNCEMENT',
  'RE_REGISTRATION'
]);

export const schoolLevelEnum = pgEnum('school_level', ['JUNIOR_HIGH', 'SENIOR_HIGH']);

export const documentTypeEnum = pgEnum('document_type', [
  'BIRTH_CERTIFICATE',
  'REPORT_CARD',
  'PHOTO',
  'PARENT_ID',
  'OTHER'
]);

export const userRoleEnum = pgEnum('user_role', ['APPLICANT', 'ADMIN', 'ADMISSION_COMMITTEE']);

// Tables
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('APPLICANT'),
  full_name: text('full_name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const applicantProfilesTable = pgTable('applicant_profiles', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  date_of_birth: timestamp('date_of_birth').notNull(),
  address: text('address').notNull(),
  phone_number: text('phone_number').notNull(),
  parent_full_name: text('parent_full_name').notNull(),
  parent_phone_number: text('parent_phone_number').notNull(),
  parent_email: text('parent_email').notNull(),
  school_level: schoolLevelEnum('school_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const applicationsTable = pgTable('applications', {
  id: serial('id').primaryKey(),
  applicant_id: integer('applicant_id').references(() => applicantProfilesTable.id).notNull(),
  application_number: text('application_number').notNull().unique(),
  status: applicationStatusEnum('status').notNull().default('INITIAL_REGISTRATION'),
  submitted_at: timestamp('submitted_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const academicRecordsTable = pgTable('academic_records', {
  id: serial('id').primaryKey(),
  application_id: integer('application_id').references(() => applicationsTable.id).notNull(),
  subject: text('subject').notNull(),
  grade: text('grade').notNull(),
  semester: text('semester').notNull(),
  academic_year: text('academic_year').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const documentsTable = pgTable('documents', {
  id: serial('id').primaryKey(),
  application_id: integer('application_id').references(() => applicationsTable.id).notNull(),
  document_type: documentTypeEnum('document_type').notNull(),
  original_filename: text('original_filename').notNull(),
  stored_filename: text('stored_filename').notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull()
});

export const notificationsTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const applicationStatusHistoryTable = pgTable('application_status_history', {
  id: serial('id').primaryKey(),
  application_id: integer('application_id').references(() => applicationsTable.id).notNull(),
  previous_status: applicationStatusEnum('previous_status'),
  new_status: applicationStatusEnum('new_status').notNull(),
  changed_by_user_id: integer('changed_by_user_id').references(() => usersTable.id).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  applicantProfile: one(applicantProfilesTable, {
    fields: [usersTable.id],
    references: [applicantProfilesTable.user_id]
  }),
  notifications: many(notificationsTable),
  statusChanges: many(applicationStatusHistoryTable)
}));

export const applicantProfilesRelations = relations(applicantProfilesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [applicantProfilesTable.user_id],
    references: [usersTable.id]
  }),
  applications: many(applicationsTable)
}));

export const applicationsRelations = relations(applicationsTable, ({ one, many }) => ({
  applicant: one(applicantProfilesTable, {
    fields: [applicationsTable.applicant_id],
    references: [applicantProfilesTable.id]
  }),
  academicRecords: many(academicRecordsTable),
  documents: many(documentsTable),
  statusHistory: many(applicationStatusHistoryTable)
}));

export const academicRecordsRelations = relations(academicRecordsTable, ({ one }) => ({
  application: one(applicationsTable, {
    fields: [academicRecordsTable.application_id],
    references: [applicationsTable.id]
  })
}));

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  application: one(applicationsTable, {
    fields: [documentsTable.application_id],
    references: [applicationsTable.id]
  })
}));

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.user_id],
    references: [usersTable.id]
  })
}));

export const applicationStatusHistoryRelations = relations(applicationStatusHistoryTable, ({ one }) => ({
  application: one(applicationsTable, {
    fields: [applicationStatusHistoryTable.application_id],
    references: [applicationsTable.id]
  }),
  changedByUser: one(usersTable, {
    fields: [applicationStatusHistoryTable.changed_by_user_id],
    references: [usersTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type ApplicantProfile = typeof applicantProfilesTable.$inferSelect;
export type NewApplicantProfile = typeof applicantProfilesTable.$inferInsert;

export type Application = typeof applicationsTable.$inferSelect;
export type NewApplication = typeof applicationsTable.$inferInsert;

export type AcademicRecord = typeof academicRecordsTable.$inferSelect;
export type NewAcademicRecord = typeof academicRecordsTable.$inferInsert;

export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;

export type Notification = typeof notificationsTable.$inferSelect;
export type NewNotification = typeof notificationsTable.$inferInsert;

export type ApplicationStatusHistory = typeof applicationStatusHistoryTable.$inferSelect;
export type NewApplicationStatusHistory = typeof applicationStatusHistoryTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  applicantProfiles: applicantProfilesTable,
  applications: applicationsTable,
  academicRecords: academicRecordsTable,
  documents: documentsTable,
  notifications: notificationsTable,
  applicationStatusHistory: applicationStatusHistoryTable
};