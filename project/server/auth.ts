import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import { insertUserSchema, loginSchema, passwordResetRequestSchema, passwordResetSchema } from "@shared/schema";
import nodemailer from "nodemailer";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "super-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration request:", JSON.stringify(req.body, null, 2));
      
      // Check for required fields
      if (!req.body.email || !req.body.username || !req.body.password || !req.body.name || !req.body.role) {
        return res.status(400).json({ message: "Missing required user information" });
      }
      
      // Extract basic user data
      const userData = {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
        role: req.body.role
      };
      
      // Basic validation
      if (!['student', 'proctor'].includes(userData.role)) {
        return res.status(400).json({ message: "Invalid role specified" });
      }
      
      // Check for existing user
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Create profile based on role
      if (user.role === 'student') {
        if (!req.body.studentProfile) {
          return res.status(400).json({ message: "Student profile information is required" });
        }

        const studentProfile = req.body.studentProfile;
        
        // Validate student profile data
        if (!studentProfile.studentId || !studentProfile.department || !studentProfile.semester) {
          return res.status(400).json({ message: "Missing required student profile information" });
        }
        
        await storage.createStudentProfile({
          userId: user.id,
          studentId: studentProfile.studentId,
          department: studentProfile.department,
          semester: Number(studentProfile.semester),
          proctorId: studentProfile.proctorId || null,
        });
      } else if (user.role === 'proctor') {
        if (!req.body.proctorProfile) {
          return res.status(400).json({ message: "Proctor profile information is required" });
        }

        const proctorProfile = req.body.proctorProfile;
        
        // Validate proctor profile data
        if (!proctorProfile.facultyId || !proctorProfile.department || !proctorProfile.designation) {
          return res.status(400).json({ message: "Missing required proctor profile information" });
        }
        
        await storage.createProctorProfile({
          userId: user.id,
          facultyId: proctorProfile.facultyId,
          department: proctorProfile.department,
          designation: proctorProfile.designation,
          phone: proctorProfile.phone || "",
        });
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        const userResponse = { ...user };
        delete userResponse.password;
        res.status(201).json(userResponse);
      });
    } catch (err) {
      console.error("Registration error:", err);
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      console.log("Login attempt for:", req.body.email);
      
      // Validate login data
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Login validation failed:", result.error.format());
        return res.status(400).json({ message: "Invalid login data", errors: result.error.format() });
      }

      passport.authenticate("local", (err: Error, user: Express.User, info: { message: string }) => {
        if (err) {
          console.error("Authentication error:", err);
          return next(err);
        }
        if (!user) {
          console.log("Authentication failed:", info.message);
          return res.status(401).json({ message: info.message || "Invalid email or password" });
        }
        
        // Check if user role matches requested role
        if (user.role !== req.body.role) {
          console.log("Role mismatch. User role:", user.role, "Requested role:", req.body.role);
          return res.status(403).json({ message: `Authentication failed. You are not a ${req.body.role}.` });
        }

        req.login(user, (err) => {
          if (err) {
            console.error("Login error:", err);
            return next(err);
          }
          const userResponse = { ...user };
          delete userResponse.password;
          console.log("Login successful for user:", userResponse.email);
          res.status(200).json(userResponse);
        });
      })(req, res, next);
    } catch (err) {
      console.error("Unexpected login error:", err);
      next(err);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userResponse = { ...req.user } as Partial<SelectUser>;
    delete userResponse.password;
    res.json(userResponse);
  });

  // Protected middleware
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isRole = (role: 'student' | 'proctor') => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.isAuthenticated() && req.user?.role === role) {
        return next();
      }
      res.status(403).json({ message: "Access forbidden" });
    };
  };

  // Password reset request endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const result = passwordResetRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }

      const { email, role } = result.data;
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== role) {
        // Don't reveal if user exists or not
        return res.status(200).json({ message: "If an account exists with that email, you will receive a password reset link" });
      }

      // Generate reset token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt
      });

      // Send email
      const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"ProctorTracker" <noreply@proctortracker.com>',
        to: email,
        subject: "Password Reset Request",
        text: `You requested to reset your password. Click the following link to reset your password: ${resetLink}`,
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested to reset your password.</p>
          <p>Click the following link to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      });

      // Clean up expired tokens
      await storage.deleteExpiredTokens();

      res.status(200).json({ message: "If an account exists with that email, you will receive a password reset link" });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const result = passwordResetSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }

      const { token, newPassword } = result.data;

      // Verify token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      const user = await storage.updateUserPassword(resetToken.userId, hashedPassword);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Mark token as used
      await storage.markTokenAsUsed(token);

      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  return { isAuthenticated, isRole };
}
