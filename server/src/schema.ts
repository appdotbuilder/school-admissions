import { z } from 'zod';

// Application status enum
export const applicationStatusSchema = z.enum([
  'INITIAL_REGISTRATION',
  'DOCUMENT_UPLOAD', 
  'SELECTION',
  'ANNOUNCEMENT',
  'RE_REGISTRATION'
]);

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

// School level enum
export const schoolLevelSchema = z.enum(['JUNIOR_HIGH', 'SENIOR_HIGH']);

export type SchoolLevel = z.infer<typeof schoolLevelSchema>;

// Document type enum
export const documentTypeSchema = z.enum([
  'BIRTH_CERTIFICATE',
  'REPORT_CARD',
  'PHOTO',
  'PARENT_ID',
  'OTHER'
]);

export type DocumentType = z.infer<typeof documentTypeSchema>;

// User role enum
export const userRoleSchema = z.enum(['APPLICANT', 'ADMIN', 'ADMISSION_COMMITTEE']);

export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleSchema,
  full_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Applicant profile schema
export const applicantProfileSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  date_of_birth: z.coerce.date(),
  address: z.string(),
  phone_number: z.string(),
  parent_full_name: z.string(),
  parent_phone_number: z.string(),
  parent_email: z.string().email(),
  school_level: schoolLevelSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ApplicantProfile = z.infer<typeof applicantProfileSchema>;

// Application schema
export const applicationSchema = z.object({
  id: z.number(),
  applicant_id: z.number(),
  application_number: z.string(),
  status: applicationStatusSchema,
  submitted_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Application = z.infer<typeof applicationSchema>;

// Academic record schema
export const academicRecordSchema = z.object({
  id: z.number(),
  application_id: z.number(),
  subject: z.string(),
  grade: z.string(),
  semester: z.string(),
  academic_year: z.string(),
  created_at: z.coerce.date()
});

export type AcademicRecord = z.infer<typeof academicRecordSchema>;

// Document schema
export const documentSchema = z.object({
  id: z.number(),
  application_id: z.number(),
  document_type: documentTypeSchema,
  original_filename: z.string(),
  stored_filename: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  uploaded_at: z.coerce.date()
});

export type Document = z.infer<typeof documentSchema>;

// Notification schema
export const notificationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  message: z.string(),
  is_read: z.boolean(),
  created_at: z.coerce.date()
});

export type Notification = z.infer<typeof notificationSchema>;

// Application status history schema
export const applicationStatusHistorySchema = z.object({
  id: z.number(),
  application_id: z.number(),
  previous_status: applicationStatusSchema.nullable(),
  new_status: applicationStatusSchema,
  changed_by_user_id: z.number(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type ApplicationStatusHistory = z.infer<typeof applicationStatusHistorySchema>;

// Input schemas for creating/updating entities

// User registration input
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  role: userRoleSchema.optional() // Default to APPLICANT
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// User login input
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Applicant profile input
export const createApplicantProfileInputSchema = z.object({
  date_of_birth: z.coerce.date(),
  address: z.string().min(1),
  phone_number: z.string().min(1),
  parent_full_name: z.string().min(1),
  parent_phone_number: z.string().min(1),
  parent_email: z.string().email(),
  school_level: schoolLevelSchema
});

export type CreateApplicantProfileInput = z.infer<typeof createApplicantProfileInputSchema>;

// Application input
export const createApplicationInputSchema = z.object({
  school_level: schoolLevelSchema
});

export type CreateApplicationInput = z.infer<typeof createApplicationInputSchema>;

// Academic record input
export const createAcademicRecordInputSchema = z.object({
  application_id: z.number(),
  subject: z.string().min(1),
  grade: z.string().min(1),
  semester: z.string().min(1),
  academic_year: z.string().min(1)
});

export type CreateAcademicRecordInput = z.infer<typeof createAcademicRecordInputSchema>;

// Document upload input
export const uploadDocumentInputSchema = z.object({
  application_id: z.number(),
  document_type: documentTypeSchema,
  original_filename: z.string(),
  stored_filename: z.string(),
  file_size: z.number(),
  mime_type: z.string()
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentInputSchema>;

// Application status update input
export const updateApplicationStatusInputSchema = z.object({
  application_id: z.number(),
  new_status: applicationStatusSchema,
  notes: z.string().nullable().optional()
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusInputSchema>;

// Notification input
export const createNotificationInputSchema = z.object({
  user_id: z.number(),
  title: z.string().min(1),
  message: z.string().min(1)
});

export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;

// Query inputs
export const getApplicationsQuerySchema = z.object({
  status: applicationStatusSchema.optional(),
  school_level: schoolLevelSchema.optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional()
});

export type GetApplicationsQuery = z.infer<typeof getApplicationsQuerySchema>;

export const getApplicationByIdInputSchema = z.object({
  id: z.number()
});

export type GetApplicationByIdInput = z.infer<typeof getApplicationByIdInputSchema>;