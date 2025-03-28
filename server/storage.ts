import { 
  users, type User, type InsertUser,
  skills, type Skill, type InsertSkill,
  jobs, type Job, type InsertJob,
  applications, type Application, type InsertApplication,
  aiSettings, type AiSettings, type InsertAiSettings,
  resumes, type Resume, type InsertResume
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id, createdAt: new Date() };
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
    const newSkill: Skill = { ...skill, id };
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
    const newJob: Job = { ...job, id };
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
      appliedAt: new Date()
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
    const newSettings: AiSettings = { ...settings, id };
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
    const newResume: Resume = { ...resume, id };
    
    // If this is set as default, unset any existing defaults
    if (newResume.isDefault) {
      for (const existingResume of this.resumes.values()) {
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
      for (const existingResume of this.resumes.values()) {
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

export const storage = new MemStorage();
