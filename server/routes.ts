import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema,
  insertSkillSchema,
  insertApplicationSchema,
  insertAiSettingsSchema,
  insertResumeSchema,
  insertJobSchema
} from "@shared/schema";
import {
  matchJobsToSkills,
  optimizeResumeForJob,
  analyzeSkillsGap,
  processAiChatMessage
} from "./lib/openai";
import { fetchExternalJobs, searchExternalJobs, matchJobsToUserSkills } from "./lib/jobsApi";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = app.route("/api");
  
  // User routes
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validateResult = insertUserSchema.safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ message: "Invalid user data", errors: validateResult.error.flatten() });
      }
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validateResult.data);
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Skill routes
  app.get("/api/users/:userId/skills", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const skills = await storage.getUserSkills(userId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Failed to get skills" });
    }
  });
  
  app.post("/api/skills", async (req: Request, res: Response) => {
    try {
      const validateResult = insertSkillSchema.safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ message: "Invalid skill data", errors: validateResult.error.flatten() });
      }
      
      const skill = await storage.createSkill(validateResult.data);
      res.status(201).json(skill);
    } catch (error) {
      res.status(500).json({ message: "Failed to create skill" });
    }
  });
  
  app.put("/api/skills/:id", async (req: Request, res: Response) => {
    try {
      const skillId = parseInt(req.params.id);
      if (isNaN(skillId)) {
        return res.status(400).json({ message: "Invalid skill ID" });
      }
      
      const updatedSkill = await storage.updateSkill(skillId, req.body);
      if (!updatedSkill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      res.json(updatedSkill);
    } catch (error) {
      res.status(500).json({ message: "Failed to update skill" });
    }
  });
  
  app.delete("/api/skills/:id", async (req: Request, res: Response) => {
    try {
      const skillId = parseInt(req.params.id);
      if (isNaN(skillId)) {
        return res.status(400).json({ message: "Invalid skill ID" });
      }
      
      const success = await storage.deleteSkill(skillId);
      if (!success) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });
  
  // Job routes
  app.get("/api/jobs", async (req: Request, res: Response) => {
    try {
      // Check if we should use real-time external data
      const useExternal = req.query.external === 'true';
      
      if (useExternal) {
        // Get search query if provided
        const query = req.query.query as string | undefined;
        
        if (query) {
          const jobs = await searchExternalJobs(query);
          return res.json(jobs);
        } else {
          const jobs = await fetchExternalJobs();
          return res.json(jobs);
        }
      }
      
      // Fall back to local storage if external flag is not set
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get jobs" });
    }
  });
  
  app.get("/api/users/:userId/jobs", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const jobs = await storage.getJobsForUser(userId, limit);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get jobs for user" });
    }
  });
  
  app.post("/api/users/:userId/jobs/match", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const skills = await storage.getUserSkills(userId);
      
      // Check if we should use external data
      const useExternal = req.query.external === 'true';
      
      if (useExternal) {
        // Get skill names as strings
        const skillNames = skills.map(skill => skill.name);
        
        // Match jobs to user skills using external API
        const matchedJobs = await matchJobsToUserSkills(skillNames);
        return res.json(matchedJobs);
      }
      
      // Otherwise use local storage and OpenAI for matching
      const jobs = await storage.getJobs();
      const matchedJobs = await matchJobsToSkills(jobs, skills);
      res.json(matchedJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to match jobs" });
    }
  });
  
  // Application routes
  app.get("/api/users/:userId/applications", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const status = req.query.status as string | undefined;
      
      const applications = status 
        ? await storage.getApplicationsByStatus(userId, status)
        : await storage.getApplications(userId);
      
      // Fetch the job details for each application
      const applicationsWithJobs = await Promise.all(
        applications.map(async (app) => {
          const job = await storage.getJob(app.jobId);
          return { ...app, job };
        })
      );
      
      res.json(applicationsWithJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get applications" });
    }
  });
  
  app.post("/api/applications", async (req: Request, res: Response) => {
    try {
      const validateResult = insertApplicationSchema.safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ message: "Invalid application data", errors: validateResult.error.flatten() });
      }
      
      const application = await storage.createApplication(validateResult.data);
      res.status(201).json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to create application" });
    }
  });
  
  app.put("/api/applications/:id", async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }
      
      const updatedApplication = await storage.updateApplication(applicationId, req.body);
      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(updatedApplication);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  });
  
  // AI Settings routes
  app.get("/api/users/:userId/ai-settings", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const settings = await storage.getAiSettings(userId);
      
      // Return default settings if none exist
      if (!settings) {
        const defaultSettings = {
          userId,
          autoApply: false,
          matchThreshold: 80,
          customizeResumes: true,
          dailyAlerts: true
        };
        
        const newSettings = await storage.createAiSettings(defaultSettings);
        return res.json(newSettings);
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get AI settings" });
    }
  });
  
  app.put("/api/users/:userId/ai-settings", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Validate request data
      const settingsSchema = z.object({
        autoApply: z.boolean().optional(),
        matchThreshold: z.number().min(0).max(100).optional(),
        customizeResumes: z.boolean().optional(),
        dailyAlerts: z.boolean().optional()
      });
      
      const validateResult = settingsSchema.safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ message: "Invalid settings data", errors: validateResult.error.flatten() });
      }
      
      // Check if settings exist, create if not
      let settings = await storage.getAiSettings(userId);
      
      if (!settings) {
        const defaultSettings = {
          userId,
          autoApply: false,
          matchThreshold: 80,
          customizeResumes: true,
          dailyAlerts: true,
          ...validateResult.data
        };
        
        settings = await storage.createAiSettings(defaultSettings);
      } else {
        // Update existing settings
        settings = await storage.updateAiSettings(userId, validateResult.data);
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update AI settings" });
    }
  });
  
  // Resume routes
  app.get("/api/users/:userId/resumes", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const resumes = await storage.getUserResumes(userId);
      res.json(resumes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get resumes" });
    }
  });
  
  app.get("/api/users/:userId/resumes/default", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const resume = await storage.getDefaultResume(userId);
      if (!resume) {
        return res.status(404).json({ message: "No default resume found" });
      }
      
      res.json(resume);
    } catch (error) {
      res.status(500).json({ message: "Failed to get default resume" });
    }
  });
  
  app.post("/api/resumes", async (req: Request, res: Response) => {
    try {
      const validateResult = insertResumeSchema.safeParse(req.body);
      if (!validateResult.success) {
        return res.status(400).json({ message: "Invalid resume data", errors: validateResult.error.flatten() });
      }
      
      const resume = await storage.createResume(validateResult.data);
      res.status(201).json(resume);
    } catch (error) {
      res.status(500).json({ message: "Failed to create resume" });
    }
  });
  
  app.put("/api/resumes/:id", async (req: Request, res: Response) => {
    try {
      const resumeId = parseInt(req.params.id);
      if (isNaN(resumeId)) {
        return res.status(400).json({ message: "Invalid resume ID" });
      }
      
      const updatedResume = await storage.updateResume(resumeId, req.body);
      if (!updatedResume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      res.json(updatedResume);
    } catch (error) {
      res.status(500).json({ message: "Failed to update resume" });
    }
  });
  
  // AI Optimization routes
  app.post("/api/jobs/:jobId/optimize-resume", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      
      const { userId, resumeId } = req.body;
      
      if (!userId || !resumeId) {
        return res.status(400).json({ message: "userId and resumeId are required" });
      }
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const skills = await storage.getUserSkills(userId);
      const resumes = await storage.getUserResumes(userId);
      const resume = resumes.find(r => r.id === resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      const optimization = await optimizeResumeForJob(resume.content, job, skills);
      res.json(optimization);
    } catch (error) {
      res.status(500).json({ message: "Failed to optimize resume" });
    }
  });
  
  app.post("/api/users/:userId/analyze-skills-gap", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const skills = await storage.getUserSkills(userId);
      const jobs = await storage.getJobs();
      
      const analysis = await analyzeSkillsGap(skills, jobs);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze skills gap" });
    }
  });
  
  // AI Chat routes
  app.post("/api/ai-chat", async (req: Request, res: Response) => {
    try {
      const { message, previousMessages } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const response = await processAiChatMessage(message, previousMessages || []);
      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
