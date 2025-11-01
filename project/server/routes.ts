import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertQuerySchema, insertQueryResponseSchema } from "@shared/schema";
import { Request, Response } from "express";

// Define user type
type User = {
  id: number;
  email: string;
  username: string;
  password: string;
  role: 'student' | 'proctor';
  name: string;
  createdAt: Date;
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  const { isAuthenticated, isRole } = setupAuth(app);
  
  // Get user profile
  app.get("/api/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      if (user.role === 'student') {
        const profile = await storage.getStudentProfile(user.id);
        if (!profile) {
          return res.status(404).json({ message: "Student profile not found" });
        }
        
        // Get proctor information if assigned
        let proctorData = null;
        if (profile.proctorId) {
          const proctorProfile = await storage.getProctorProfileById(profile.proctorId);
          if (proctorProfile) {
            const proctorUser = await storage.getUser(proctorProfile.userId);
            if (proctorUser) {
              proctorData = {
                id: proctorProfile.id,
                name: proctorUser.name,
                email: proctorUser.email,
                department: proctorProfile.department,
                designation: proctorProfile.designation,
                phone: proctorProfile.phone,
              };
            }
          }
        }
        
        res.json({ profile, proctor: proctorData });
      } else if (user.role === 'proctor') {
        const profile = await storage.getProctorProfile(user.id);
        if (!profile) {
          return res.status(404).json({ message: "Proctor profile not found" });
        }
        res.json({ profile });
      } else {
        res.status(400).json({ message: "Invalid user role" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Student routes
  app.get("/api/student/attendance", isAuthenticated, isRole('student'), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const studentProfile = await storage.getStudentProfile(user.id);
      if (!studentProfile) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      
      const attendance = await storage.getStudentAttendance(studentProfile.id);
      
      // Calculate course-wise attendance percentage
      const courseAttendance: Record<string, { total: number; present: number; percentage: number }> = {};
      
      attendance.forEach(record => {
        if (!courseAttendance[record.courseName]) {
          courseAttendance[record.courseName] = { total: 0, present: 0, percentage: 0 };
        }
        
        courseAttendance[record.courseName].total++;
        if (record.isPresent) {
          courseAttendance[record.courseName].present++;
        }
      });
      
      // Calculate percentages
      let overallPresent = 0;
      let overallTotal = 0;
      
      Object.keys(courseAttendance).forEach(course => {
        const { total, present } = courseAttendance[course];
        const percentage = total > 0 ? (present / total) * 100 : 0;
        courseAttendance[course].percentage = Number(percentage.toFixed(2));
        
        overallPresent += present;
        overallTotal += total;
      });
      
      const overallPercentage = overallTotal > 0 
        ? Number(((overallPresent / overallTotal) * 100).toFixed(2)) 
        : 0;
        
      res.json({
        records: attendance,
        courseWise: courseAttendance,
        overall: {
          total: overallTotal,
          present: overallPresent,
          percentage: overallPercentage
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/student/academic", isAuthenticated, isRole('student'), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Fetching academic records for user:", req.user.id);
      
      const studentProfile = await storage.getStudentProfile(req.user.id);
      if (!studentProfile) {
        console.log("Student profile not found for user:", req.user.id);
        return res.status(404).json({ message: "Student profile not found" });
      }
      
      console.log("Found student profile:", studentProfile.id);
      const academics = await storage.getStudentAcademicRecords(studentProfile.id);
      console.log("Fetched academic records:", academics.length);
      
      res.json({ 
        records: academics,
        cgpa: studentProfile.cgpa
      });
    } catch (error) {
      console.error("Failed to fetch academic records:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch academic records", error: errorMessage });
    }
  });

  app.get("/api/student/queries", isAuthenticated, isRole('student'), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const queries = await storage.getStudentQueries(user.id);
      res.json({ queries });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch queries" });
    }
  });

  app.post("/api/student/queries", isAuthenticated, isRole('student'), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Creating new query:", req.body);
      
      // First get the student's profile to get their proctor
      const studentProfile = await storage.getStudentProfile(req.user.id);
      if (!studentProfile) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      if (!studentProfile.proctorId) {
        return res.status(400).json({ message: "No proctor assigned to student" });
      }

      // Get proctor's user ID
      const proctorProfile = await storage.getProctorProfileById(studentProfile.proctorId);
      if (!proctorProfile) {
        return res.status(404).json({ message: "Proctor not found" });
      }

      // Create query with validated data
      const queryData = {
        studentId: req.user.id,
        proctorId: proctorProfile.userId,
        subject: req.body.subject,
        description: req.body.description
      };

      const result = insertQuerySchema.safeParse(queryData);
      if (!result.success) {
        console.log("Query validation error:", result.error.format());
        return res.status(400).json({ 
          message: "Invalid query data",
          errors: result.error.format()
        });
      }
      
      const newQuery = await storage.createQuery(queryData);
      console.log("Created new query:", newQuery);
      
      res.status(201).json({ query: newQuery });
    } catch (error) {
      console.error("Error creating query:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create query", error: errorMessage });
    }
  });

  // Proctor routes
  app.get("/api/proctor/students", isAuthenticated, isRole('proctor'), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const proctorProfile = await storage.getProctorProfile(user.id);
      if (!proctorProfile) {
        return res.status(404).json({ message: "Proctor profile not found" });
      }
      
      const students = await storage.getStudentsByProctor(proctorProfile.id);
      
      // Enrich with user data and attendance/performance data
      const enrichedStudents = await Promise.all(students.map(async (student) => {
        const user = await storage.getUser(student.userId);
        if (!user) return null;
        
        const attendanceRecords = await storage.getStudentAttendance(student.id);
        const academicRecords = await storage.getStudentAcademicRecords(student.id);
        
        // Calculate attendance percentage
        let totalClasses = attendanceRecords.length;
        let presentClasses = attendanceRecords.filter(record => record.isPresent).length;
        let attendancePercentage = totalClasses > 0 
          ? Number(((presentClasses / totalClasses) * 100).toFixed(2)) 
          : 0;
        
        return {
          id: student.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          studentId: student.studentId,
          department: student.department,
          semester: student.semester,
          cgpa: student.cgpa,
          attendance: {
            percentage: attendancePercentage,
            total: totalClasses,
            present: presentClasses
          }
        };
      }));
      
      // Filter out any null values (user not found)
      const validStudents = enrichedStudents.filter(student => student !== null);
      
      res.json({ students: validStudents });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/proctor/student/:id", isAuthenticated, isRole('proctor'), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      const studentProfile = await storage.getStudentProfileById(studentId);
      if (!studentProfile) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const proctorProfile = await storage.getProctorProfile(currentUser.id);
      if (!proctorProfile || studentProfile.proctorId !== proctorProfile.id) {
        return res.status(403).json({ message: "You are not the proctor for this student" });
      }
      
      const user = await storage.getUser(studentProfile.userId);
      if (!user) {
        return res.status(404).json({ message: "Student user not found" });
      }
      
      const attendance = await storage.getStudentAttendance(studentProfile.id);
      const academics = await storage.getStudentAcademicRecords(studentProfile.id);
      
      res.json({
        student: {
          id: studentProfile.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          studentId: studentProfile.studentId,
          department: studentProfile.department,
          semester: studentProfile.semester,
          cgpa: studentProfile.cgpa
        },
        attendance,
        academics
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student details" });
    }
  });

  app.get("/api/proctor/queries", isAuthenticated, isRole('proctor'), async (req: Request, res: Response) => {
    try {
      const currentUser = req.user as User;
      const queries = await storage.getProctorQueries(currentUser.id);
      
      // Enrich with student data
      const enrichedQueries = await Promise.all(queries.map(async (query) => {
        const student = await storage.getUser(query.studentId);
        return {
          ...query,
          student: student ? {
            id: student.id,
            name: student.name,
            email: student.email
          } : null
        };
      }));
      
      res.json({ queries: enrichedQueries });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch queries" });
    }
  });

  app.post("/api/proctor/queries/:id/respond", isAuthenticated, isRole('proctor'), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const queryId = parseInt(req.params.id);
      if (isNaN(queryId)) {
        return res.status(400).json({ message: "Invalid query ID" });
      }
      
      const result = insertQueryResponseSchema.pick({ response: true }).safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid response data" });
      }
      
      const query = await storage.getQueryById(queryId);
      if (!query) {
        return res.status(404).json({ message: "Query not found" });
      }
      
      if (query.proctorId !== user.id) {
        return res.status(403).json({ message: "You cannot respond to this query" });
      }
      
      const response = await storage.createQueryResponse({
        queryId,
        userId: user.id,
        response: req.body.response
      });
      
      // Update query status if it's pending
      if (query.status === 'pending') {
        await storage.updateQueryStatus(queryId, 'in_progress');
      }
      
      res.status(201).json({ response });
    } catch (error) {
      res.status(500).json({ message: "Failed to create response" });
    }
  });

  app.patch("/api/proctor/queries/:id/status", isAuthenticated, isRole('proctor'), async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const queryId = parseInt(req.params.id);
      if (isNaN(queryId)) {
        return res.status(400).json({ message: "Invalid query ID" });
      }
      
      const statusSchema = z.object({
        status: z.enum(['pending', 'in_progress', 'resolved', 'closed'])
      });
      
      const result = statusSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const query = await storage.getQueryById(queryId);
      if (!query) {
        return res.status(404).json({ message: "Query not found" });
      }
      
      if (query.proctorId !== user.id) {
        return res.status(403).json({ message: "You cannot update this query" });
      }
      
      const updatedQuery = await storage.updateQueryStatus(queryId, req.body.status);
      
      res.json({ query: updatedQuery });
    } catch (error) {
      res.status(500).json({ message: "Failed to update query status" });
    }
  });

  app.get("/api/proctor/academic", isAuthenticated, isRole('proctor'), async (req: Request, res: Response) => {
    try {
      // We know user exists and has correct type due to isAuthenticated and isRole middleware
      const user = req.user as { id: number };
      const proctorProfile = await storage.getProctorProfile(user.id);
      if (!proctorProfile) {
        return res.status(404).json({ message: "Proctor profile not found" });
      }
      
      // Get all students assigned to this proctor
      const students = await storage.getStudentsByProctor(proctorProfile.id);
      
      // Get academic records for all students
      const academicRecords = await Promise.all(
        students.map(student => storage.getStudentAcademicRecords(student.id))
      );
      
      // Flatten all academic records
      const allRecords = academicRecords.flat();
      
      // Group by subject and calculate averages
      const subjectGroups = allRecords.reduce((acc, record) => {
        if (!acc[record.courseName]) {
          acc[record.courseName] = {
            totalScore: (record.internalMarks ?? 0) + (record.quizMarks ?? 0) + 
                       (record.projectMarks ?? 0) + (record.semesterMarks ?? 0),
            count: 1
          };
        } else {
          acc[record.courseName].totalScore += (record.internalMarks ?? 0) + (record.quizMarks ?? 0) + 
                                             (record.projectMarks ?? 0) + (record.semesterMarks ?? 0);
          acc[record.courseName].count += 1;
        }
        return acc;
      }, {} as Record<string, { totalScore: number; count: number; }>);
      
      // Calculate averages and format response
      const subjects = Object.entries(subjectGroups).map(([subject, data]) => ({
        subject,
        avgScore: Number((data.totalScore / data.count).toFixed(2))
      }));
      
      res.json({ subjects });
    } catch (error) {
      console.error("Error fetching academic data:", error);
      res.status(500).json({ message: "Failed to fetch academic data" });
    }
  });

  // Shared routes
  app.get("/api/queries/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const queryId = parseInt(req.params.id);
      if (isNaN(queryId)) {
        return res.status(400).json({ message: "Invalid query ID" });
      }
      
      const query = await storage.getQueryById(queryId);
      if (!query) {
        return res.status(404).json({ message: "Query not found" });
      }
      
      // Check if the user is allowed to view this query
      if (query.studentId !== user.id && query.proctorId !== user.id) {
        return res.status(403).json({ message: "You do not have permission to view this query" });
      }
      
      const responses = await storage.getQueryResponses(queryId);
      
      // Get user data for the student and proctor
      const student = await storage.getUser(query.studentId);
      const proctor = await storage.getUser(query.proctorId);
      
      // Enrich responses with user data
      const enrichedResponses = await Promise.all(responses.map(async (response) => {
        const user = await storage.getUser(response.userId);
        return {
          ...response,
          user: user ? {
            id: user.id,
            name: user.name,
            role: user.role
          } : null
        };
      }));
      
      res.json({
        query,
        student: student ? {
          id: student.id,
          name: student.name,
          email: student.email
        } : null,
        proctor: proctor ? {
          id: proctor.id,
          name: proctor.name,
          email: proctor.email
        } : null,
        responses: enrichedResponses
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch query details" });
    }
  });

  app.post("/api/queries/:id/respond", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const queryId = parseInt(req.params.id);
      if (isNaN(queryId)) {
        return res.status(400).json({ message: "Invalid query ID" });
      }
      
      const result = insertQueryResponseSchema.pick({ response: true }).safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid response data" });
      }
      
      const query = await storage.getQueryById(queryId);
      if (!query) {
        return res.status(404).json({ message: "Query not found" });
      }
      
      // Check if the user is allowed to respond to this query
      if (query.studentId !== user.id && query.proctorId !== user.id) {
        return res.status(403).json({ message: "You do not have permission to respond to this query" });
      }
      
      const response = await storage.createQueryResponse({
        queryId,
        userId: user.id,
        response: req.body.response
      });
      
      res.status(201).json({ response });
    } catch (error) {
      res.status(500).json({ message: "Failed to create response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
