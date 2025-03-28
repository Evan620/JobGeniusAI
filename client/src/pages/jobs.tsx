import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Briefcase, DollarSign, Star, RefreshCw, Globe, Bookmark } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Job } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

// Mock userId for development (would come from auth context)
const userId = 1;

export default function Jobs() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobType, setSelectedJobType] = useState<string | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>("standard");
  
  // DuckDuckGo search state
  const [duckQuery, setDuckQuery] = useState("");
  const [duckLocation, setDuckLocation] = useState("");
  const [isDuckSearching, setIsDuckSearching] = useState(false);
  
  // Toggle for real-time job data
  const [useRealTimeData, setUseRealTimeData] = useState(true);
  
  // Query parameters for job search
  const queryParams = {
    external: useRealTimeData ? 'true' : 'false',
    query: searchQuery || undefined
  };
  
  // Get jobs from API with the query parameters
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['/api/jobs', queryParams],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // DuckDuckGo search query
  const { 
    data: duckJobs, 
    isLoading: isLoadingDuckJobs, 
    refetch: refetchDuckJobs 
  } = useQuery({
    queryKey: ['/api/duckduckgo/jobs'],
    queryFn: async () => {
      if (!duckQuery.trim()) {
        throw new Error("Search query is required");
      }
      const params = new URLSearchParams();
      params.append('query', duckQuery);
      if (duckLocation.trim()) {
        params.append('location', duckLocation);
      }
      return apiRequest('GET', `/api/duckduckgo/jobs?${params.toString()}`);
    },
    enabled: false, // Don't fetch on mount
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle DuckDuckGo search
  const handleDuckDuckGoSearch = async () => {
    if (!duckQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a job title or keyword to search",
        variant: "destructive"
      });
      return;
    }
    
    setIsDuckSearching(true);
    try {
      await refetchDuckJobs();
      setIsDuckSearching(false);
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search DuckDuckGo for jobs",
        variant: "destructive"
      });
      setIsDuckSearching(false);
    }
  };
  
  const handleApply = async (jobId: number) => {
    try {
      // Create application for this job
      await apiRequest('POST', '/api/applications', {
        userId: 1, // Would get from auth context
        jobId,
        status: "applied",
        aiOptimized: true
      });
      
      toast({
        title: "Application Submitted",
        description: "Your AI-optimized application has been submitted",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply for job",
        variant: "destructive"
      });
    }
  };

  const filteredJobs = jobs
    ? jobs.filter((job: Job) => {
        // Search query filter
        const matchesSearch = !searchQuery || 
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Job type filter
        const matchesJobType = !selectedJobType || selectedJobType === "all" || job.jobType === selectedJobType;
        
        // Location filter
        const matchesLocation = !selectedLocation || selectedLocation === "all" || job.location.includes(selectedLocation);
        
        return matchesSearch && matchesJobType && matchesLocation;
      })
    : [];

  // Get unique job types and locations for filters
  const jobTypes = jobs 
    ? Array.from(new Set(jobs.map((job: Job) => job.jobType).filter(Boolean)))
    : [];
  
  const locations = jobs
    ? Array.from(new Set(jobs.map((job: Job) => job.location).filter(Boolean)))
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activePath={location} />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-heading font-bold text-[#2D3E50]">Job Search</h1>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Use Real-Time Data</span>
              <Switch 
                checked={useRealTimeData} 
                onCheckedChange={(checked) => {
                  setUseRealTimeData(checked);
                  // Invalidate the query to refresh the data
                  queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
                }}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
                }}
                title="Refresh Jobs"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tabs for different search modes */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standard" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Standard Search
              </TabsTrigger>
              <TabsTrigger value="duckduckgo" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Web Search (DuckDuckGo)
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="standard" className="mt-4">
              {/* Standard Search UI */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search jobs, companies, or keywords"
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Select
                        value={selectedJobType}
                        onValueChange={setSelectedJobType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Job Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Job Types</SelectItem>
                          {jobTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Select
                        value={selectedLocation}
                        onValueChange={setSelectedLocation}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Standard Jobs Listings */}
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D3E50]"></div>
                </div>
              ) : filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">No jobs found</h3>
                    <p className="text-gray-600">Try adjusting your search filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job: Job) => (
                    <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-2/3 p-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-[#2D3E50]">{job.title}</h3>
                                <p className="text-gray-600">{job.company}</p>
                              </div>
                              <Badge variant="outline" className={job.jobType === 'Remote' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                {job.jobType}
                              </Badge>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" /> {job.location}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Briefcase className="h-4 w-4 mr-2" /> {job.source || 'Direct'}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <DollarSign className="h-4 w-4 mr-2" /> {job.salary || 'Not disclosed'}
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                              {job.skills?.slice(0, 4).map((skill, index) => (
                                <Badge key={index} variant="outline" className="bg-[#4AC1BD] bg-opacity-10 text-[#4AC1BD]">
                                  {skill}
                                </Badge>
                              ))}
                              {job.skills && job.skills.length > 4 && (
                                <Badge variant="outline">+{job.skills.length - 4} more</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="md:w-1/3 p-6 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Match Score</span>
                                <span className="font-semibold text-[#2D3E50]">{job.matchScore || 0}%</span>
                              </div>
                              <Progress value={job.matchScore || 0} className="h-2" />
                              
                              <div className="mt-4">
                                <div className="flex items-center text-sm text-[#2D3E50]">
                                  <Star className="h-4 w-4 mr-1 text-[#FFD700]" />
                                  <span>AI Match Insights:</span>
                                </div>
                                <ul className="mt-2 text-xs text-gray-600 space-y-1">
                                  <li>• Strong match for your technical skills</li>
                                  <li>• Aligns with your salary preferences</li>
                                  <li>• Company culture matches your values</li>
                                </ul>
                              </div>
                            </div>
                            
                            <div className="mt-6">
                              <Button 
                                className="w-full bg-[#2D3E50]"
                                onClick={() => handleApply(job.id)}
                              >
                                Apply with AI
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full mt-2"
                              >
                                <Bookmark className="h-4 w-4 mr-2" />
                                Save Job
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="duckduckgo" className="mt-4">
              {/* DuckDuckGo Search UI */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search job titles across the web"
                          className="pl-10"
                          value={duckQuery}
                          onChange={(e) => setDuckQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Input
                        placeholder="Location (optional)"
                        value={duckLocation}
                        onChange={(e) => setDuckLocation(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Button 
                        className="w-full bg-[#2D3E50]"
                        onClick={handleDuckDuckGoSearch}
                        disabled={isDuckSearching}
                      >
                        {isDuckSearching ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Searching...
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 mr-2" />
                            Search Jobs
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* DuckDuckGo Job Listings */}
              {isLoadingDuckJobs ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D3E50]"></div>
                </div>
              ) : duckJobs && duckJobs.length > 0 ? (
                <div className="space-y-4">
                  {duckJobs.map((job: Job) => (
                    <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-2/3 p-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-[#2D3E50]">{job.title}</h3>
                                <p className="text-gray-600">{job.company}</p>
                              </div>
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                Web Search
                              </Badge>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" /> {job.location || 'Location not specified'}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Globe className="h-4 w-4 mr-2" /> {job.source || 'DuckDuckGo'}
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
                            </div>
                            
                            {job.link && (
                              <div className="mt-4">
                                <a 
                                  href={job.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center"
                                >
                                  <Globe className="h-3 w-3 mr-1" /> View original listing
                                </a>
                              </div>
                            )}
                          </div>
                          
                          <div className="md:w-1/3 p-6 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center text-sm text-[#2D3E50] mb-4">
                                <Star className="h-4 w-4 mr-1 text-[#FFD700]" />
                                <span>Found via DuckDuckGo search</span>
                              </div>
                              <p className="text-xs text-gray-600">
                                This job was discovered through a web search. Apply directly through the employer's website.
                              </p>
                            </div>
                            
                            <div className="mt-6">
                              {job.link ? (
                                <Button 
                                  className="w-full bg-[#2D3E50]"
                                  onClick={() => window.open(job.link, '_blank')}
                                >
                                  Apply on Website
                                </Button>
                              ) : (
                                <Button 
                                  className="w-full bg-[#2D3E50]"
                                  disabled
                                >
                                  No Application Link
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                className="w-full mt-2"
                                onClick={() => handleApply(job.id)}
                              >
                                Save to My Applications
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : duckJobs && duckJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">No jobs found</h3>
                    <p className="text-gray-600">Try a different search query or location</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">🌐</div>
                    <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">Search the web for jobs</h3>
                    <p className="text-gray-600">Enter a job title and optional location, then click Search</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
