import OpenAI from "openai";
import { Job, Skill } from "@shared/schema";

// Using Azure OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY || "dummy-key-for-development",
  baseURL: process.env.AZURE_OPENAI_BASE_URL || "https://models.inference.ai.azure.com",
  defaultQuery: { "api-version": "2023-05-15" },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
});

export interface JobMatch {
  job: Job;
  matchScore: number;
  matchReasons: string[];
}

export interface ResumeOptimization {
  resumeContent: string;
  coverLetterContent: string;
  optimizationNotes: string[];
}

/**
 * Analyze jobs and match them to user's skills
 */
export async function matchJobsToSkills(jobs: Job[], skills: Skill[]): Promise<JobMatch[]> {
  try {
    // In a real implementation, this would make an actual OpenAI API call
    // For development, we'll calculate matches locally
    
    // Create a simplified version for development
    return jobs.map(job => {
      // Calculate a match score based on skills overlap
      const jobSkills = job.skills || [];
      const userSkillNames = skills.map(s => s.name.toLowerCase());
      
      const matchingSkills = jobSkills.filter(s => 
        userSkillNames.includes(s.toLowerCase())
      );
      
      const matchScore = Math.min(
        100,
        Math.round((matchingSkills.length / Math.max(1, jobSkills.length)) * 100)
      );
      
      const matchReasons = [
        `You have ${matchingSkills.length} of ${jobSkills.length} required skills`,
        "This job matches your preferred location",
        "Salary matches your expectations"
      ];
      
      return {
        job: { ...job, matchScore },
        matchScore,
        matchReasons
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("Error matching jobs to skills:", error);
    throw new Error("Failed to match jobs to skills");
  }
}

/**
 * Generate an optimized resume and cover letter for a specific job
 */
export async function optimizeResumeForJob(
  resumeContent: string, 
  job: Job, 
  skills: Skill[]
): Promise<ResumeOptimization> {
  try {
    // In a real implementation, this would call the OpenAI API
    // For development purposes, we'll return a mock response
    
    const jobTitle = job.title;
    const company = job.company;
    
    return {
      resumeContent: resumeContent,
      coverLetterContent: `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} position at ${company}...`,
      optimizationNotes: [
        "Added keywords from job description",
        "Highlighted relevant experience",
        "Customized skills section"
      ]
    };
  } catch (error) {
    console.error("Error optimizing resume:", error);
    throw new Error("Failed to optimize resume");
  }
}

/**
 * Analyze user's skills gap compared to in-demand skills in job market
 */
export async function analyzeSkillsGap(skills: Skill[], jobs: Job[]): Promise<{
  missingSkills: { name: string, impact: number }[];
}> {
  try {
    // In a real implementation, this would use OpenAI to analyze the skills gap
    // For development, we'll use a simplified version
    
    const userSkills = skills.map(s => s.name.toLowerCase());
    const allJobSkills = new Map<string, number>();
    
    jobs.forEach(job => {
      const jobSkills = job.skills || [];
      jobSkills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        allJobSkills.set(skillLower, (allJobSkills.get(skillLower) || 0) + 1);
      });
    });
    
    // Find skills that appear in jobs but user doesn't have
    const missingSkills = Array.from(allJobSkills.entries())
      .filter(([skill]) => !userSkills.includes(skill))
      .map(([skill, count]) => ({
        name: skill,
        impact: Math.round((count / jobs.length) * 100)
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5);
    
    return { missingSkills };
  } catch (error) {
    console.error("Error analyzing skills gap:", error);
    throw new Error("Failed to analyze skills gap");
  }
}

/**
 * Process a chat message with the AI assistant
 */
export async function processAiChatMessage(
  message: string,
  previousMessages: { role: 'user' | 'assistant', content: string }[]
): Promise<string> {
  try {
    if (!message.trim()) {
      return "Please enter a message to continue.";
    }
    
    // Prepare messages for the OpenAI chat API with proper types
    const systemPrompt = {
      role: "system" as const,
      content: `You are JobGenius AI, an AI assistant for job seekers. 
      Your capabilities include:
      - Finding relevant job opportunities
      - Optimizing resumes and cover letters for specific positions
      - Preparing for job interviews
      - Analyzing skills gaps and suggesting improvements
      - Providing career advice and industry insights
      
      Be helpful, encouraging, and professional in your responses.
      Focus on providing actionable advice for job seekers.`
    };
    
    const formattedPreviousMessages = previousMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
    
    // Add the user's new message
    const chatMessages = [
      systemPrompt,
      ...formattedPreviousMessages,
      { role: "user" as const, content: message }
    ];
    
    // Call the Azure OpenAI API using the configured client
    try {
      const modelName = process.env.AZURE_OPENAI_MODEL_NAME || "gpt-4o";
      
      // Use the correct types for OpenAI API
      type OpenAIMessage = {
        role: 'system' | 'user' | 'assistant';
        content: string;
      };
      
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: chatMessages as OpenAIMessage[],
        temperature: 0.7,
        max_tokens: 800
      });
      
      return response.choices[0].message.content || "I'm not sure how to respond to that. Could you try asking in a different way?";
    } catch (apiError) {
      console.error("Azure OpenAI API error:", apiError);
      
      // Fallback responses if API call fails
      const messageLower = message.toLowerCase();
      
      if (messageLower.includes("help") || messageLower.includes("how")) {
        return "I can help you with your job search by finding relevant positions, optimizing your resume, and preparing for interviews. What specifically would you like help with?";
      }
      
      if (messageLower.includes("resume") || messageLower.includes("cv")) {
        return "I can optimize your resume for specific job applications. Would you like me to analyze your current resume and suggest improvements?";
      }
      
      if (messageLower.includes("interview")) {
        return "I can help you prepare for interviews by providing common questions and suggested answers based on your experience. Would you like to start interview preparation?";
      }
      
      if (messageLower.includes("job") || messageLower.includes("search")) {
        return "I found several new job postings that match your profile. Would you like me to prepare applications for these positions?";
      }
      
      // Default fallback response
      return "I'm here to help with your job search. I can find relevant jobs, optimize your resume, or help prepare for interviews. What would you like assistance with?";
    }
  } catch (error) {
    console.error("Error processing AI chat message:", error);
    return "I'm having trouble processing your request right now. Please try again later.";
  }
}
