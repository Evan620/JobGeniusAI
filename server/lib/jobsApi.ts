import { Job, InsertJob } from '@shared/schema';
import axios from 'axios';

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: string;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

/**
 * Fetch jobs from Arbeitnow API
 */
export async function fetchExternalJobs(): Promise<Job[]> {
  try {
    const response = await axios.get<ArbeitnowResponse>('https://arbeitnow.com/api/job-board-api');
    
    // Transform API response to our Job schema
    return response.data.data.map((job: ArbeitnowJob) => {
      return {
        id: parseInt(job.slug.replace(/\D/g, '')) || Math.floor(Math.random() * 10000), // Generate an ID from slug or random
        title: job.title,
        company: job.company_name,
        location: job.location || 'Remote',
        description: job.description,
        link: job.url,
        salary: null,
        jobType: job.remote ? 'Remote' : (job.job_types.length > 0 ? job.job_types[0] : 'Full-time'),
        source: 'Arbeitnow',
        skills: job.tags || [],
        matchScore: null
      };
    });
  } catch (error) {
    console.error('Error fetching jobs from external API:', error);
    return [];
  }
}

/**
 * Search for jobs based on query
 */
export async function searchExternalJobs(query: string): Promise<Job[]> {
  const jobs = await fetchExternalJobs();
  
  if (!query) return jobs;
  
  const lowerQuery = query.toLowerCase();
  
  return jobs.filter(job => 
    job.title.toLowerCase().includes(lowerQuery) ||
    job.company.toLowerCase().includes(lowerQuery) ||
    job.description.toLowerCase().includes(lowerQuery) ||
    job.location.toLowerCase().includes(lowerQuery) ||
    (job.skills && job.skills.some(skill => skill.toLowerCase().includes(lowerQuery)))
  );
}

/**
 * Match jobs to user skills
 */
export async function matchJobsToUserSkills(skills: string[]): Promise<Job[]> {
  const jobs = await fetchExternalJobs();
  
  return jobs.map(job => {
    // Calculate match score based on user skills and job skills/title/description
    let matchScore = 0;
    let matchCount = 0;
    
    if (job.skills && job.skills.length > 0) {
      skills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        
        // Check exact match in skills
        if (job.skills?.some(jobSkill => jobSkill.toLowerCase() === skillLower)) {
          matchCount += 2;
        }
        // Check partial match in skills
        else if (job.skills?.some(jobSkill => jobSkill.toLowerCase().includes(skillLower))) {
          matchCount += 1;
        }
        
        // Check if skill mentioned in title
        if (job.title.toLowerCase().includes(skillLower)) {
          matchCount += 1;
        }
        
        // Check if skill mentioned in description
        if (job.description.toLowerCase().includes(skillLower)) {
          matchCount += 0.5;
        }
      });
      
      // Calculate percentage match
      matchScore = Math.min(100, Math.round((matchCount / (skills.length * 2)) * 100));
    }
    
    return {
      ...job,
      matchScore
    };
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}