import { pgTable, text, serial, integer, boolean, pgEnum, timestamp, foreignKey, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Role enum for users
export const roleEnum = pgEnum('role', ['student', 'proctor']);

// Users table with role information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users relations
export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
    relationName: "user_student_profile",
  }),
  proctorProfile: one(proctorProfiles, {
    fields: [users.id],
    references: [proctorProfiles.userId],
    relationName: "user_proctor_profile",
  }),
  submittedQueries: many(queries, {
    relationName: "student_queries",
  }),
  assignedQueries: many(queries, {
    relationName: "proctor_queries",
  }),
}));

// Student profiles table
export const studentProfiles = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  studentId: text("student_id").notNull().unique(),
  department: text("department").notNull(),
  proctorId: integer("proctor_id").references(() => proctorProfiles.id),
  semester: integer("semester").notNull(),
  cgpa: real("cgpa").default(0),
});

// Student profile relations
export const studentProfilesRelations = relations(studentProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [studentProfiles.userId],
    references: [users.id],
    relationName: "user_student_profile",
  }),
  proctor: one(proctorProfiles, {
    fields: [studentProfiles.proctorId],
    references: [proctorProfiles.id],
  }),
  attendance: many(attendance),
  academicRecords: many(academicRecords),
}));

// Proctor profiles table
export const proctorProfiles = pgTable("proctor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  facultyId: text("faculty_id").notNull().unique(),
  department: text("department").notNull(),
  phone: text("phone"),
  designation: text("designation").notNull(),
});

// Proctor profile relations
export const proctorProfilesRelations = relations(proctorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [proctorProfiles.userId],
    references: [users.id],
    relationName: "user_proctor_profile",
  }),
  assignedStudents: many(studentProfiles, {
    relationName: "proctor_students"
  }),
}));

// Attendance table
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: 'cascade' }),
  courseId: text("course_id").notNull(),
  courseName: text("course_name").notNull(),
  date: timestamp("date").notNull(),
  isPresent: boolean("is_present").notNull(),
});

// Attendance relations
export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(studentProfiles, {
    fields: [attendance.studentId],
    references: [studentProfiles.id],
  }),
}));

// Academic records table
export const academicRecords = pgTable("academic_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: 'cascade' }),
  courseId: text("course_id").notNull(),
  courseName: text("course_name").notNull(),
  semester: integer("semester").notNull(),
  internalMarks: real("internal_marks").default(0),
  quizMarks: real("quiz_marks").default(0),
  projectMarks: real("project_marks").default(0),
  semesterMarks: real("semester_marks").default(0),
  CGPA: real("cgpa").default(0),
});

// Academic records relations
export const academicRecordsRelations = relations(academicRecords, ({ one }) => ({
  student: one(studentProfiles, {
    fields: [academicRecords.studentId],
    references: [studentProfiles.id],
  }),
}));

// Query status enum
export const queryStatusEnum = pgEnum('query_status', ['pending', 'in_progress', 'resolved', 'closed']);

// Queries table
export const queries = pgTable("queries", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  proctorId: integer("proctor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: queryStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Queries relations
export const queriesRelations = relations(queries, ({ one, many }) => ({
  student: one(users, {
    fields: [queries.studentId],
    references: [users.id],
    relationName: "student_queries",
  }),
  proctor: one(users, {
    fields: [queries.proctorId],
    references: [users.id],
    relationName: "proctor_queries",
  }),
  responses: many(queryResponses),
}));

// Query responses table
export const queryResponses = pgTable("query_responses", {
  id: serial("id").primaryKey(),
  queryId: integer("query_id").notNull().references(() => queries.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Query responses relations
export const queryResponsesRelations = relations(queryResponses, ({ one }) => ({
  query: one(queries, {
    fields: [queryResponses.queryId],
    references: [queries.id],
  }),
  user: one(users, {
    fields: [queryResponses.userId],
    references: [users.id],
  }),
}));

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
});

// Password reset token relations
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Insert schema for password reset token
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["student", "proctor"]),
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true
});

export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({ 
  id: true,
  cgpa: true
});

export const insertProctorProfileSchema = createInsertSchema(proctorProfiles).omit({ 
  id: true 
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ 
  id: true 
});

export const insertAcademicRecordSchema = createInsertSchema(academicRecords).omit({ 
  id: true 
});

export const insertQuerySchema = createInsertSchema(queries).omit({ 
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
});

export const insertQueryResponseSchema = createInsertSchema(queryResponses).omit({ 
  id: true,
  createdAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type StudentProfile = typeof studentProfiles.$inferSelect;

export type InsertProctorProfile = z.infer<typeof insertProctorProfileSchema>;
export type ProctorProfile = typeof proctorProfiles.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type InsertAcademicRecord = z.infer<typeof insertAcademicRecordSchema>;
export type AcademicRecord = typeof academicRecords.$inferSelect;

export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Query = typeof queries.$inferSelect;

export type InsertQueryResponse = z.infer<typeof insertQueryResponseSchema>;
export type QueryResponse = typeof queryResponses.$inferSelect;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "proctor"]),
});

export type LoginData = z.infer<typeof loginSchema>;
