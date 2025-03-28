import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StatsCard } from "@/components/dashboard/stats-card";
import { JobCard } from "@/components/dashboard/job-card";
import { ApplicationCard } from "@/components/dashboard/application-card";
import { AIAssistant } from "@/components/dashboard/ai-assistant";
import { SkillsGap } from "@/components/dashboard/skills-gap";
import { Button } from "@/components/ui/button";
import { Search, Send, Calendar, TrendingUp, BarChart2, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Job, Application, AiSettings } from "@shared/schema";

// Mock userId for development (would come from auth context)
const userId = 1;

interface JobMatch {
  job: Job;
  matchScore: number;
  matchReasons: string[];
}

export default function Dashboard() {
  const [location] = useLocation();
  const [topJobs, setTopJobs] = useState<JobMatch[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  
  // Toggle for real-time job data
  const [useRealTimeData, setUseRealTimeData] = useState(true);

  // Fetch job matches with real-time API option
  const { data: jobMatches = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: [`/api/users/${userId}/jobs/match`, { external: useRealTimeData ? 'true' : 'false' }],
    queryFn: async ({ queryKey }) => {
      try {
        const useExternal = queryKey[1] && typeof queryKey[1] === 'object' && (queryKey[1] as any).external === 'true';
        const res = await fetch(`/api/users/${userId}/jobs/match${useExternal ? '?external=true' : ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) return [];
        
        const data = await res.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching job matches:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch applications
  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: [`/api/users/${userId}/applications`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch AI settings
  const { data: aiSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: [`/api/users/${userId}/ai-settings`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch skills gap analysis
  const { data: skillsGapData, isLoading: isLoadingSkillsGap } = useQuery({
    queryKey: [`/api/users/${userId}/analyze-skills-gap`],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Update AI settings mutation
  const updateAiSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<AiSettings>) => {
      const res = await apiRequest('PUT', `/api/users/${userId}/ai-settings`, settings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/ai-settings`] });
      toast({
        title: "Settings updated",
        description: "Your AI settings have been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update AI settings",
        variant: "destructive",
      });
    },
  });

  // When job matches data loads, set up the top jobs
  useEffect(() => {
    if (jobMatches && Array.isArray(jobMatches)) {
      // Check for the job array format from external API vs the internal format
      if (jobMatches.length > 0 && 'matchScore' in jobMatches[0]) {
        // Format is already correct - array of JobMatch objects
        setTopJobs(jobMatches);
      } else if (jobMatches.length > 0 && 'job' in jobMatches[0]) {
        // For compatibility with different API response formats
        setTopJobs(jobMatches as JobMatch[]);
      } else {
        // Transform regular jobs into job matches
        const transformedJobs = jobMatches.map(job => ({
          job: job,
          matchScore: job.matchScore || 75,
          matchReasons: ['Skill match', 'Location match', 'Experience level']
        }));
        setTopJobs(transformedJobs);
      }
    }
  }, [jobMatches]);

  const handleJobSwipe = (direction: 'left' | 'right') => {
    setCurrentJobIndex(prevIndex => prevIndex + 1);
  };

  // Filter applications by status
  const getApplicationsByStatus = (status: string) => {
    if (!applications) return [];
    return applications.filter((app: Application & { job?: Job }) => 
      app.status.toLowerCase() === status.toLowerCase()
    );
  };

  const appliedJobs = getApplicationsByStatus('applied');
  const interviewJobs = getApplicationsByStatus('interview');
  const offerJobs = getApplicationsByStatus('offer');

  // Stats for the dashboard
  const stats = {
    jobsFound: jobMatches?.length || 0,
    applied: appliedJobs.length,
    interviews: interviewJobs.length,
    matchRate: "85%"
  };

  const handleUpdateAiSettings = (settings: Partial<AiSettings>) => {
    updateAiSettingsMutation.mutate(settings);
  };

  const isLoading = isLoadingJobs || isLoadingApplications || isLoadingSettings || isLoadingSkillsGap;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activePath={location} />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Welcome Banner */}
          <div className="px-4 py-6 sm:px-0 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h1 className="text-2xl font-heading font-bold text-[#2D3E50]">Welcome back, Alex</h1>
                    <p className="text-gray-600 mt-1">Your job search is looking great today!</p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Button className="bg-[#2D3E50] hover:bg-opacity-90">
                      <Search className="mr-2 h-4 w-4" /> New Job Search
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <StatsCard 
                    title="Jobs Found" 
                    value={stats.jobsFound} 
                    icon={Search} 
                    iconColor="text-[#4AC1BD]" 
                    iconBgColor="bg-[#4AC1BD]" 
                  />
                  <StatsCard 
                    title="Applied" 
                    value={stats.applied} 
                    icon={Send} 
                    iconColor="text-[#FFD700]" 
                    iconBgColor="bg-[#FFD700]" 
                  />
                  <StatsCard 
                    title="Interviews" 
                    value={stats.interviews} 
                    icon={Calendar} 
                    iconColor="text-green-500" 
                    iconBgColor="bg-green-500" 
                  />
                  <StatsCard 
                    title="Match Rate" 
                    value={stats.matchRate} 
                    icon={TrendingUp} 
                    iconColor="text-purple-500" 
                    iconBgColor="bg-purple-500" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 sm:px-0">
            {/* Job Match Column */}
            <div>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-[#2D3E50]">Top Matches</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Real-time</span>
                        <Switch 
                          checked={useRealTimeData} 
                          onCheckedChange={(checked) => {
                            setUseRealTimeData(checked);
                            queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/jobs/match`] });
                          }}
                          className="scale-75"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/jobs/match`] })}
                        title="Refresh Job Matches"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <span className="text-sm text-gray-500">12 new</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Tinder-like Job Card Stack */}
                  <div className="relative h-[480px] mb-4">
                    {isLoadingJobs ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D3E50]"></div>
                      </div>
                    ) : topJobs.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500">No jobs available</p>
                      </div>
                    ) : (
                      topJobs.slice(currentJobIndex, currentJobIndex + 3).map((jobMatch, index) => {
                        // Make sure job exists and has an id, if not, generate a temporary one
                        const job = jobMatch.job || {};
                        const safeId = job.id || `temp-job-${index}-${Date.now()}`;
                        
                        return (
                          <JobCard 
                            key={safeId}
                            job={job}
                            matchScore={jobMatch.matchScore}
                            matchReasons={jobMatch.matchReasons || ['Skills match', 'Location match']}
                            onSwipe={handleJobSwipe}
                            zIndex={3 - index}
                            style={{ top: `${index * 8}px` }}
                          />
                        );
                      })
                    )}
                  </div>
                  
                  <div className="text-center">
                    <Button variant="link" className="text-gray-600 hover:text-[#2D3E50] text-sm font-medium w-full">
                      View all matches <span className="ml-1">→</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Application Tracking Column */}
            <div>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-[#2D3E50]">Application Tracking</CardTitle>
                    <Button variant="ghost" size="sm" className="text-sm">Filter</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Kanban Board */}
                  <div className="space-y-4">
                    {/* Applied Section */}
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="bg-blue-100 w-2 h-2 rounded-full mr-2"></span>
                        <h3 className="font-medium text-[#2D3E50]">Applied</h3>
                        <span className="ml-auto text-sm text-gray-500">{appliedJobs.length}</span>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {isLoadingApplications ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2D3E50]"></div>
                          </div>
                        ) : appliedJobs.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-500">
                            No applications yet
                          </div>
                        ) : (
                          appliedJobs.map((application) => (
                            <ApplicationCard key={application.id} application={application} />
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Interview Section */}
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="bg-purple-100 w-2 h-2 rounded-full mr-2"></span>
                        <h3 className="font-medium text-[#2D3E50]">Interview</h3>
                        <span className="ml-auto text-sm text-gray-500">{interviewJobs.length}</span>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {isLoadingApplications ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2D3E50]"></div>
                          </div>
                        ) : interviewJobs.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-500">
                            No interviews scheduled
                          </div>
                        ) : (
                          interviewJobs.map((application) => (
                            <ApplicationCard key={application.id} application={application} />
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Offer Section */}
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="bg-green-100 w-2 h-2 rounded-full mr-2"></span>
                        <h3 className="font-medium text-[#2D3E50]">Offer</h3>
                        <span className="ml-auto text-sm text-gray-500">{offerJobs.length}</span>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {isLoadingApplications ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2D3E50]"></div>
                          </div>
                        ) : offerJobs.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-500">
                            No offers yet
                          </div>
                        ) : (
                          offerJobs.map((application) => (
                            <ApplicationCard key={application.id} application={application} />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* AI Control Column */}
            <div>
              {isLoadingSettings ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D3E50]"></div>
                </div>
              ) : aiSettings && (
                <AIAssistant 
                  aiSettings={aiSettings} 
                  onUpdateSettings={handleUpdateAiSettings} 
                />
              )}
            </div>
          </div>
          
          {/* Analytics Section */}
          <div className="mt-6 px-4 sm:px-0">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold text-[#2D3E50]">Your Analytics</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Week</Button>
                    <Button size="sm" className="bg-[#2D3E50]">Month</Button>
                    <Button variant="outline" size="sm">Year</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Application Success Rate */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md font-medium text-[#2D3E50]">Application Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="inline-block rounded-full bg-[#4AC1BD] p-4">
                            <BarChart2 className="text-white h-6 w-6" />
                          </div>
                          <p className="mt-2 text-sm text-gray-500">Interactive chart would appear here</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Skills Gap Analysis */}
                  {isLoadingSkillsGap ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D3E50]"></div>
                    </div>
                  ) : skillsGapData?.missingSkills && (
                    <SkillsGap skillGaps={skillsGapData.missingSkills} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
