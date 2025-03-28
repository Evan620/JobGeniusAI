import axios from 'axios';
import { Job } from '@shared/schema';

/**
 * Scrape job listings from DuckDuckGo search results
 * @param query Search query for jobs
 * @param location Optional location parameter
 */
export async function searchDuckDuckGo(query: string, location?: string): Promise<Job[]> {
  try {
    // Format the search query
    const searchQuery = location ? 
      `${query} jobs in ${location}` : 
      `${query} jobs`;
    
    // Use DuckDuckGo's lite version which is more easily parsed
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://lite.duckduckgo.com/lite?q=${encodedQuery}`;
    
    const response = await axios.get(url);
    
    // Parse the HTML response
    const html = response.data;
    
    // Extract job listings from the HTML (simplified)
    // This is a very basic extraction - production code would use a proper HTML parser
    const jobListings = extractJobListings(html);
    
    // Transform to our Job schema
    return jobListings.map((listing, index) => ({
      id: Date.now() + index, // Generate unique ids
      title: listing.title,
      company: listing.company || 'Company via DuckDuckGo',
      location: listing.location || location || 'Remote',
      description: listing.description || 'Click to view full job details',
      link: listing.url,
      salary: null,
      jobType: null,
      source: 'DuckDuckGo',
      skills: [],
      matchScore: null
    }));
  } catch (error) {
    console.error('Error fetching from DuckDuckGo:', error);
    return [];
  }
}

/**
 * Extracts job listings from DuckDuckGo HTML response
 * This is a simplified version - a real implementation would use a proper HTML parser
 */
function extractJobListings(html: string): Array<{
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url: string;
}> {
  const results: Array<{
    title: string;
    company?: string;
    location?: string;
    description?: string;
    url: string;
  }> = [];
  
  try {
    // Split the HTML by result items
    const resultRegex = /<a class="result-link" href="([^"]+)">(.*?)<\/a>/g;
    const snippetRegex = /<a class="result-snippet".*?>(.*?)<\/a>/g;
    
    let resultMatch;
    let snippetMatch;
    
    // Find all result links
    while ((resultMatch = resultRegex.exec(html)) !== null) {
      snippetMatch = snippetRegex.exec(html);
      
      const url = resultMatch[1].trim();
      const title = stripTags(resultMatch[2]).trim();
      let description = '';
      
      if (snippetMatch && snippetMatch[1]) {
        description = stripTags(snippetMatch[1]).trim();
      }
      
      // Try to extract company and location from description
      let company = '';
      let location = '';
      
      // Check if description contains company patterns like "at Company" or "Company -"
      const companyMatch = description.match(/(at|by|from|via)\s+([A-Za-z0-9\s]+)[\s-]/) || 
                          description.match(/([A-Za-z0-9\s]+)\s+(-|–)\s+/);
      
      if (companyMatch) {
        company = companyMatch[2].trim();
      }
      
      // Check for location patterns like "in Location" or "Location, State"
      const locationMatch = description.match(/\s+in\s+([A-Za-z0-9\s,]+)/) ||
                           description.match(/([A-Za-z]+,\s*[A-Z]{2})/);
                           
      if (locationMatch) {
        location = locationMatch[1].trim();
      }
      
      // Only add if it looks like a job listing (contains job-related keywords)
      if (isJobListing(title, description)) {
        results.push({
          title,
          company,
          location,
          description,
          url
        });
      }
    }
  } catch (error) {
    console.error('Error parsing DuckDuckGo results:', error);
  }
  
  return results;
}

/**
 * Strips HTML tags from a string
 */
function stripTags(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, '');
}

/**
 * Checks if a search result is likely a job listing
 */
function isJobListing(title: string, description: string): boolean {
  const jobKeywords = [
    'job', 'career', 'position', 'hiring', 'employment', 'work', 'opportunity',
    'full-time', 'part-time', 'remote', 'hybrid', 'onsite', 'salary'
  ];
  
  const combinedText = (title + ' ' + description).toLowerCase();
  return jobKeywords.some(keyword => combinedText.includes(keyword));
}