import { 
  users, type User, type InsertUser,
  skills, type Skill, type InsertSkill,
  jobs, type Job, type InsertJob,
  applications, type Application, type InsertApplication,
  aiSettings, type AiSettings, type InsertAiSettings,
  resumes, type Resume, type InsertResume
} from "@shared/schema";
import { db } from "./db";
import { eq, and, not, SQL } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { Client } from "pg";

export interface IStorage {
  // Session store
  sessionStore: any;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Skills methods
  getUserSkills(userId: number): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: number, skill: Partial<Skill>): Promise<Skill | undefined>;
  deleteSkill(id: number): Promise<boolean>;

  // Jobs methods
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  getJobsForUser(userId: number, limit?: number): Promise<Job[]>;
  
  // Applications methods
  getApplications(userId: number): Promise<Application[]>;
  getApplicationsByStatus(userId: number, status: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: Partial<Application>): Promise<Application | undefined>;
  
  // AI Settings methods
  getAiSettings(userId: number): Promise<AiSettings | undefined>;
  createAiSettings(settings: InsertAiSettings): Promise<AiSettings>;
  updateAiSettings(userId: number, settings: Partial<AiSettings>): Promise<AiSettings | undefined>;
  
  // Resume methods
  getUserResumes(userId: number): Promise<Resume[]>;
  getDefaultResume(userId: number): Promise<Resume | undefined>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: number, resume: Partial<Resume>): Promise<Resume | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private skills: Map<number, Skill>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  private aiSettings: Map<number, AiSettings>;
  private resumes: Map<number, Resume>;
  private userIdCounter: number;
  private skillIdCounter: number;
  private jobIdCounter: number;
  private applicationIdCounter: number;
  private aiSettingsIdCounter: number;
  private resumeIdCounter: number;
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.skills = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.aiSettings = new Map();
    this.resumes = new Map();
    this.userIdCounter = 1;
    this.skillIdCounter = 1;
    this.jobIdCounter = 1;
    this.applicationIdCounter = 1;
    this.aiSettingsIdCounter = 1;
    this.resumeIdCounter = 1;
    
    // Create a memory store for sessions
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add sample data for testing
    this.initSampleData();
  }

  private initSampleData() {
    // Sample jobs
    const sampleJobs: InsertJob[] = [
      {
        title: "Senior Frontend Developer",
        company: "Aurora Consulting",
        location: "San Francisco, CA",
        description: "We're looking for a senior frontend developer with React and TypeScript experience to join our growing team.",
        salary: "$130K - $150K",
        jobType: "Remote",
        source: "LinkedIn",
        link: "https://example.com/job1",
        skills: ["React.js", "TypeScript", "Redux", "CSS-in-JS"],
        matchScore: 92
      },
      {
        title: "UI/UX Designer",
        company: "TechFlow Inc.",
        location: "New York, NY",
        description: "Design beautiful, intuitive interfaces for our enterprise clients.",
        salary: "$110K - $130K",
        jobType: "Hybrid",
        source: "Indeed",
        link: "https://example.com/job2",
        skills: ["Figma", "UI Design", "User Research", "Prototyping"],
        matchScore: 85
      },
      {
        title: "Frontend Developer",
        company: "Quantum Systems",
        location: "Boston, MA",
        description: "Work on cutting-edge web applications with modern JavaScript frameworks.",
        salary: "$100K - $120K",
        jobType: "Remote",
        source: "Glassdoor",
        link: "https://example.com/job3",
        skills: ["React.js", "JavaScript", "HTML", "CSS"],
        matchScore: 78
      },
      {
        title: "Product Designer",
        company: "Nova Creative",
        location: "Seattle, WA",
        description: "Join our product team to create amazing user experiences.",
        salary: "$120K - $140K",
        jobType: "On-site",
        source: "LinkedIn",
        link: "https://example.com/job4",
        skills: ["Product Design", "UI/UX", "Design Systems", "Wireframing"],
        matchScore: 88
      },
      {
        title: "UX Researcher",
        company: "Insight Partners",
        location: "Chicago, IL",
        description: "Conduct user research to improve our products and services.",
        salary: "$90K - $110K",
        jobType: "Remote",
        source: "Indeed",
        link: "https://example.com/job5",
        skills: ["User Research", "Usability Testing", "Data Analysis", "Interviewing"],
        matchScore: 82
      },
      {
        title: "Senior UI Designer",
        company: "Stellar Digital",
        location: "Austin, TX",
        description: "Lead UI design initiatives for our flagship products.",
        salary: "$125K - $145K",
        jobType: "Remote",
        source: "Glassdoor",
        link: "https://example.com/job6",
        skills: ["UI Design", "Design Systems", "Figma", "Adobe Creative Suite"],
        matchScore: 95
      }
    ];

    // Add jobs
    sampleJobs.forEach(job => {
      this.createJob(job);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id, 
      createdAt: new Date(),
      profilePicture: user.profilePicture ?? null,
      githubId: user.githubId ?? null,
      githubAccessToken: user.githubAccessToken ?? null,
      githubRefreshToken: user.githubRefreshToken ?? null,
      linkedinId: user.linkedinId ?? null,
      linkedinAccessToken: user.linkedinAccessToken ?? null,
      linkedinRefreshToken: user.linkedinRefreshToken ?? null
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Skills methods
  async getUserSkills(userId: number): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(skill => skill.userId === userId);
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const id = this.skillIdCounter++;
    const newSkill: Skill = { 
      ...skill, 
      id,
      level: skill.level ?? null 
    };
    this.skills.set(id, newSkill);
    return newSkill;
  }

  async updateSkill(id: number, skillData: Partial<Skill>): Promise<Skill | undefined> {
    const skill = this.skills.get(id);
    if (!skill) return undefined;

    const updatedSkill = { ...skill, ...skillData };
    this.skills.set(id, updatedSkill);
    return updatedSkill;
  }

  async deleteSkill(id: number): Promise<boolean> {
    return this.skills.delete(id);
  }

  // Jobs methods
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    
    // Convert skills to proper string array if needed
    let processedSkills: string[] | null = null;
    if (job.skills) {
      if (Array.isArray(job.skills)) {
        processedSkills = job.skills.map(s => String(s));
      } else {
        processedSkills = [];
      }
    }
    
    const newJob: Job = { 
      ...job, 
      id,
      company: job.company ?? '',
      title: job.title ?? '',
      description: job.description ?? '',
      location: job.location ?? '',
      salary: job.salary ?? null,
      link: job.link ?? null,
      jobType: job.jobType ?? null,
      source: job.source ?? null,
      matchScore: job.matchScore ?? null,
      skills: processedSkills
    };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async getJobsForUser(userId: number, limit?: number): Promise<Job[]> {
    // In a real app, we'd match jobs based on user skills
    // For now, return all jobs sorted by match score
    const allJobs = Array.from(this.jobs.values()).sort((a, b) => 
      (b.matchScore || 0) - (a.matchScore || 0)
    );
    
    return limit ? allJobs.slice(0, limit) : allJobs;
  }

  // Applications methods
  async getApplications(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(application => application.userId === userId);
  }

  async getApplicationsByStatus(userId: number, status: string): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(application => application.userId === userId && application.status === status);
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const newApplication: Application = { 
      ...application, 
      id, 
      appliedAt: new Date(),
      status: application.status ?? 'pending',
      interviewDate: application.interviewDate ?? null,
      notes: application.notes ?? null,
      aiOptimized: application.aiOptimized ?? null
    };
    this.applications.set(id, newApplication);
    return newApplication;
  }

  async updateApplication(id: number, applicationData: Partial<Application>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;

    const updatedApplication = { ...application, ...applicationData };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // AI Settings methods
  async getAiSettings(userId: number): Promise<AiSettings | undefined> {
    return Array.from(this.aiSettings.values()).find(setting => setting.userId === userId);
  }

  async createAiSettings(settings: InsertAiSettings): Promise<AiSettings> {
    const id = this.aiSettingsIdCounter++;
    const newSettings: AiSettings = { 
      ...settings, 
      id,
      autoApply: settings.autoApply ?? null,
      matchThreshold: settings.matchThreshold ?? null,
      customizeResumes: settings.customizeResumes ?? null,
      dailyAlerts: settings.dailyAlerts ?? null
    };
    this.aiSettings.set(id, newSettings);
    return newSettings;
  }

  async updateAiSettings(userId: number, settingsData: Partial<AiSettings>): Promise<AiSettings | undefined> {
    const settings = Array.from(this.aiSettings.values()).find(setting => setting.userId === userId);
    if (!settings) return undefined;

    const updatedSettings = { ...settings, ...settingsData };
    this.aiSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }

  // Resume methods
  async getUserResumes(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(resume => resume.userId === userId);
  }

  async getDefaultResume(userId: number): Promise<Resume | undefined> {
    return Array.from(this.resumes.values()).find(
      resume => resume.userId === userId && resume.isDefault
    );
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const id = this.resumeIdCounter++;
    const newResume: Resume = { 
      ...resume, 
      id,
      isDefault: resume.isDefault ?? null
    };
    
    // If this is set as default, unset any existing defaults
    if (newResume.isDefault) {
      const existingResumes = Array.from(this.resumes.values());
      for (let i = 0; i < existingResumes.length; i++) {
        const existingResume = existingResumes[i];
        if (existingResume.userId === resume.userId && existingResume.isDefault) {
          existingResume.isDefault = false;
          this.resumes.set(existingResume.id, existingResume);
        }
      }
    }
    
    this.resumes.set(id, newResume);
    return newResume;
  }

  async updateResume(id: number, resumeData: Partial<Resume>): Promise<Resume | undefined> {
    const resume = this.resumes.get(id);
    if (!resume) return undefined;

    const updatedResume = { ...resume, ...resumeData };
    
    // If this is being set as default, unset any existing defaults
    if (resumeData.isDefault) {
      const existingResumes = Array.from(this.resumes.values());
      for (let i = 0; i < existingResumes.length; i++) {
        const existingResume = existingResumes[i];
        if (existingResume.userId === resume.userId && 
            existingResume.id !== id && 
            existingResume.isDefault) {
          existingResume.isDefault = false;
          this.resumes.set(existingResume.id, existingResume);
        }
      }
    }
    
    this.resumes.set(id, updatedResume);
    return updatedResume;
  }
}

// Create PostgreSQL connection pool
import pg from 'pg';
const Pool = pg.Pool;

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const PostgresSessionStore = connectPg(session);

// Create DatabaseStorage class for persistent storage
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: pgPool,
      tableName: 'session',
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUserSkills(userId: number): Promise<Skill[]> {
    return await db.select().from(skills).where(eq(skills.userId, userId));
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }

  async updateSkill(id: number, skillData: Partial<Skill>): Promise<Skill | undefined> {
    const [updatedSkill] = await db
      .update(skills)
      .set(skillData)
      .where(eq(skills.id, id))
      .returning();
    return updatedSkill;
  }

  async deleteSkill(id: number): Promise<boolean> {
    const result = await db.delete(skills).where(eq(skills.id, id));
    return result.count > 0;
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createJob(job: InsertJob): Promise<Job> {
    // Handle skills array serialization properly for PostgreSQL
    const jobToInsert = {
      ...job,
      skills: job.skills ? job.skills : null
    };
    
    const [newJob] = await db.insert(jobs).values(jobToInsert).returning();
    return newJob;
  }

  async getJobsForUser(userId: number, limit?: number): Promise<Job[]> {
    // First get the base query
    let result = await db.select().from(jobs).orderBy(jobs.matchScore);
    
    // Then apply limit if needed
    if (limit && result.length > limit) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  async getApplications(userId: number): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.userId, userId));
  }

  async getApplicationsByStatus(userId: number, status: string): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.status, status)
        )
      );
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApplication] = await db.insert(applications).values(application).returning();
    return newApplication;
  }

  async updateApplication(id: number, applicationData: Partial<Application>): Promise<Application | undefined> {
    const [updatedApplication] = await db
      .update(applications)
      .set(applicationData)
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  async getAiSettings(userId: number): Promise<AiSettings | undefined> {
    const [settings] = await db.select().from(aiSettings).where(eq(aiSettings.userId, userId));
    return settings;
  }

  async createAiSettings(settings: InsertAiSettings): Promise<AiSettings> {
    const [newSettings] = await db.insert(aiSettings).values(settings).returning();
    return newSettings;
  }

  async updateAiSettings(userId: number, settingsData: Partial<AiSettings>): Promise<AiSettings | undefined> {
    const [updatedSettings] = await db
      .update(aiSettings)
      .set(settingsData)
      .where(eq(aiSettings.userId, userId))
      .returning();
    return updatedSettings;
  }

  async getUserResumes(userId: number): Promise<Resume[]> {
    return await db.select().from(resumes).where(eq(resumes.userId, userId));
  }

  async getDefaultResume(userId: number): Promise<Resume | undefined> {
    const [resume] = await db
      .select()
      .from(resumes)
      .where(
        and(
          eq(resumes.userId, userId),
          eq(resumes.isDefault, true)
        )
      );
    return resume;
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    // If this resume is marked as default, unset any existing defaults
    if (resume.isDefault) {
      await db
        .update(resumes)
        .set({ isDefault: false })
        .where(
          and(
            eq(resumes.userId, resume.userId),
            eq(resumes.isDefault, true)
          )
        );
    }

    const [newResume] = await db.insert(resumes).values(resume).returning();
    return newResume;
  }

  async updateResume(id: number, resumeData: Partial<Resume>): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    
    if (!resume) return undefined;
    
    // If this resume is being set as default, unset any existing defaults
    if (resumeData.isDefault) {
      // First, unset all defaults for this user
      await db
        .update(resumes)
        .set({ isDefault: false })
        .where(
          and(
            eq(resumes.userId, resume.userId),
            eq(resumes.isDefault, true)
          )
        );
    }
    
    const [updatedResume] = await db
      .update(resumes)
      .set(resumeData)
      .where(eq(resumes.id, id))
      .returning();
    
    return updatedResume;
  }
}

// Create our storage instance
export const storage = new DatabaseStorage();

// Add these helper methods to create database tables if needed
export async function createDbTables() {
  try {
    // Check if tables exist
    const tablesExist = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const needsCreation = !tablesExist[0]?.exists;
    
    if (needsCreation) {
      console.log('Tables do not exist, creating tables...');
      
      // Pushing schema to database
      const { drizzle } = await import('drizzle-orm/postgres-js');
      const { migrate } = await import('drizzle-orm/postgres-js/migrator');
      const postgres = await import('postgres');
      
      // Connect directly with postgres
      const migrationClient = postgres.default(process.env.DATABASE_URL!, { max: 1 });
      const migrationDb = drizzle(migrationClient);
      
      // Use push API to create tables
      console.log('Running schema migration...');
      await db.execute(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
      
      // Use simple SQL to create tables rather than a complex migration
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          profile_picture TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          github_id TEXT,
          github_access_token TEXT,
          github_refresh_token TEXT,
          linkedin_id TEXT,
          linkedin_access_token TEXT,
          linkedin_refresh_token TEXT
        );
        
        CREATE TABLE IF NOT EXISTS skills (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          level TEXT
        );
        
        CREATE TABLE IF NOT EXISTS jobs (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          company TEXT NOT NULL,
          location TEXT NOT NULL,
          description TEXT NOT NULL,
          salary TEXT,
          job_type TEXT,
          source TEXT,
          link TEXT,
          skills TEXT[],
          match_score INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS applications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          job_id INTEGER NOT NULL REFERENCES jobs(id),
          status TEXT NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW(),
          interview_date TIMESTAMP,
          notes TEXT,
          ai_optimized BOOLEAN
        );
        
        CREATE TABLE IF NOT EXISTS ai_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          auto_apply BOOLEAN,
          match_threshold INTEGER,
          customize_resumes BOOLEAN,
          daily_alerts BOOLEAN
        );
        
        CREATE TABLE IF NOT EXISTS resumes (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          is_default BOOLEAN
        );
      `);
      
      console.log('Schema migration completed successfully.');
    } else {
      console.log('Database tables already exist.');
    }
  } catch (err) {
    console.error('Error managing database tables:', err);
    throw err; // Re-throw to prevent app startup with db issues
  }
}
