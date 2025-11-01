import { users, studentProfiles, proctorProfiles, attendance, academicRecords, queries, queryResponses, passwordResetTokens, type User, type InsertUser, type StudentProfile, type InsertStudentProfile, type ProctorProfile, type InsertProctorProfile, type Attendance, type InsertAttendance, type AcademicRecord, type InsertAcademicRecord, type Query, type InsertQuery, type QueryResponse, type InsertQueryResponse, type PasswordResetToken, type InsertPasswordResetToken } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, asc, gt, lt, isNotNull, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Student profile operations
  getStudentProfile(userId: number): Promise<StudentProfile | undefined>;
  getStudentProfileById(id: number): Promise<StudentProfile | undefined>;
  createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  updateStudentProfile(id: number, profile: Partial<StudentProfile>): Promise<StudentProfile | undefined>;
  
  // Proctor profile operations
  getProctorProfile(userId: number): Promise<ProctorProfile | undefined>;
  getProctorProfileById(id: number): Promise<ProctorProfile | undefined>;
  createProctorProfile(profile: InsertProctorProfile): Promise<ProctorProfile>;
  updateProctorProfile(id: number, profile: Partial<ProctorProfile>): Promise<ProctorProfile | undefined>;
  
  // Attendance operations
  getStudentAttendance(studentId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  
  // Academic record operations
  getStudentAcademicRecords(studentId: number): Promise<AcademicRecord[]>;
  createAcademicRecord(record: InsertAcademicRecord): Promise<AcademicRecord>;
  
  // Query operations
  getStudentQueries(studentId: number): Promise<Query[]>;
  getProctorQueries(proctorId: number): Promise<Query[]>;
  getQueryById(id: number): Promise<Query | undefined>;
  createQuery(query: InsertQuery): Promise<Query>;
  updateQueryStatus(id: number, status: 'pending' | 'in_progress' | 'resolved' | 'closed'): Promise<Query | undefined>;
  
  // Query response operations
  getQueryResponses(queryId: number): Promise<QueryResponse[]>;
  createQueryResponse(response: InsertQueryResponse): Promise<QueryResponse>;

  // Proctor-specific operations
  getStudentsByProctor(proctorId: number): Promise<StudentProfile[]>;
  
  // Session store
  sessionStore: any;

  // Helper function to create sample academic records
  createSampleAcademicRecords(studentId: number): Promise<void>;

  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<PasswordResetToken | undefined>;
  deleteExpiredTokens(): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'user_sessions',
      schemaName: 'public',
      pruneSessionInterval: false
    });

    // Test session store connection
    this.sessionStore.pruneSessions((err: any) => {
      if (err) {
        console.error('Session store connection error:', err);
      } else {
        console.log('Session store connected successfully');
      }
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Student profile operations
  async getStudentProfile(userId: number): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
    return profile;
  }

  async getStudentProfileById(id: number): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, id));
    return profile;
  }

  async createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile> {
    const [studentProfile] = await db.insert(studentProfiles).values(profile).returning();
    return studentProfile;
  }

  async updateStudentProfile(id: number, profile: Partial<StudentProfile>): Promise<StudentProfile | undefined> {
    const [updatedProfile] = await db
      .update(studentProfiles)
      .set(profile)
      .where(eq(studentProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  // Proctor profile operations
  async getProctorProfile(userId: number): Promise<ProctorProfile | undefined> {
    const [profile] = await db.select().from(proctorProfiles).where(eq(proctorProfiles.userId, userId));
    return profile;
  }

  async getProctorProfileById(id: number): Promise<ProctorProfile | undefined> {
    const [profile] = await db.select().from(proctorProfiles).where(eq(proctorProfiles.id, id));
    return profile;
  }

  async createProctorProfile(profile: InsertProctorProfile): Promise<ProctorProfile> {
    const [proctorProfile] = await db.insert(proctorProfiles).values(profile).returning();
    return proctorProfile;
  }

  async updateProctorProfile(id: number, profile: Partial<ProctorProfile>): Promise<ProctorProfile | undefined> {
    const [updatedProfile] = await db
      .update(proctorProfiles)
      .set(profile)
      .where(eq(proctorProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  // Attendance operations
  async getStudentAttendance(studentId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async createAttendance(attendanceRecord: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(attendanceRecord).returning();
    return record;
  }

  // Academic record operations
  async getStudentAcademicRecords(studentId: number): Promise<AcademicRecord[]> {
    try {
      console.log("Fetching academic records from database for student:", studentId);
      const records = await db
        .select()
        .from(academicRecords)
        .where(eq(academicRecords.studentId, studentId));
      console.log("Found academic records:", records);
      return records;
    } catch (error) {
      console.error("Database error while fetching academic records:", error);
      throw error;
    }
  }

  async createAcademicRecord(record: InsertAcademicRecord): Promise<AcademicRecord> {
    try {
      console.log("Creating academic record:", record);
      const [academicRecord] = await db
        .insert(academicRecords)
        .values(record)
        .returning();
      console.log("Created academic record:", academicRecord);
      return academicRecord;
    } catch (error) {
      console.error("Database error while creating academic record:", error);
      throw error;
    }
  }

  // Query operations
  async getStudentQueries(studentId: number): Promise<Query[]> {
    return db
      .select()
      .from(queries)
      .where(eq(queries.studentId, studentId))
      .orderBy(desc(queries.createdAt));
  }

  async getProctorQueries(proctorId: number): Promise<Query[]> {
    return db
      .select()
      .from(queries)
      .where(eq(queries.proctorId, proctorId))
      .orderBy(desc(queries.createdAt));
  }

  async getQueryById(id: number): Promise<Query | undefined> {
    const [query] = await db.select().from(queries).where(eq(queries.id, id));
    return query;
  }

  async createQuery(query: InsertQuery): Promise<Query> {
    const [newQuery] = await db.insert(queries).values(query).returning();
    return newQuery;
  }

  async updateQueryStatus(id: number, status: 'pending' | 'in_progress' | 'resolved' | 'closed'): Promise<Query | undefined> {
    const [updatedQuery] = await db
      .update(queries)
      .set({ status, updatedAt: new Date() })
      .where(eq(queries.id, id))
      .returning();
    return updatedQuery;
  }

  // Query response operations
  async getQueryResponses(queryId: number): Promise<QueryResponse[]> {
    return db
      .select()
      .from(queryResponses)
      .where(eq(queryResponses.queryId, queryId))
      .orderBy(asc(queryResponses.createdAt));
  }

  async createQueryResponse(response: InsertQueryResponse): Promise<QueryResponse> {
    const [newResponse] = await db.insert(queryResponses).values(response).returning();
    return newResponse;
  }

  // Proctor-specific operations
  async getStudentsByProctor(proctorId: number): Promise<StudentProfile[]> {
    const proctorProfile = await this.getProctorProfileById(proctorId);
    if (!proctorProfile) return [];
    
    return db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.proctorId, proctorProfile.id));
  }

  // Helper function to create sample academic records
  async createSampleAcademicRecords(studentId: number): Promise<void> {
    const sampleCourses = [
      { courseId: 'CS101', courseName: 'Introduction to Computer Science' },
      { courseId: 'CS102', courseName: 'Data Structures' },
      { courseId: 'CS103', courseName: 'Algorithms' },
      { courseId: 'MTH101', courseName: 'Calculus I' }
    ];

    try {
      console.log("Creating sample academic records for student:", studentId);
      
      for (const course of sampleCourses) {
        await this.createAcademicRecord({
          studentId,
          courseId: course.courseId,
          courseName: course.courseName,
          semester: 1,
          internalMarks: Math.floor(Math.random() * 30) + 70, // Random marks between 70-100
          quizMarks: Math.floor(Math.random() * 30) + 70,
          projectMarks: Math.floor(Math.random() * 30) + 70,
          semesterMarks: Math.floor(Math.random() * 30) + 70,
          CGPA: Math.floor(Math.random() * 30) + 70
        });
      }
      
      console.log("Successfully created sample academic records");
    } catch (error) {
      console.error("Error creating sample academic records:", error);
      throw error;
    }
  }

  // Password reset operations
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [resetToken] = await db.insert(passwordResetTokens).values(token).returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        isNotNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      ));
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<PasswordResetToken | undefined> {
    const [updatedToken] = await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token))
      .returning();
    return updatedToken;
  }

  async deleteExpiredTokens(): Promise<void> {
    await db.delete(passwordResetTokens)
      .where(or(
        lt(passwordResetTokens.expiresAt, new Date()),
        isNotNull(passwordResetTokens.usedAt)
      ));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
