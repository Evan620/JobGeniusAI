import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ApplicationCard } from "@/components/dashboard/application-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Application, Job } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Mock userId for development (would come from auth context)
const userId = 1;

export default function Applications() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all applications
  const { data: applications, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/applications`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest('PUT', `/api/applications/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/applications`] });
      toast({
        title: "Application updated",
        description: "Application status has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    },
  });

  // Filter applications by status and search query
  const filterApplications = (apps: (Application & { job?: Job })[], status?: string) => {
    if (!apps) return [];
    
    return apps.filter((app) => {
      const matchesStatus = !status || app.status.toLowerCase() === status.toLowerCase();
      const matchesSearch = !searchQuery || 
        (app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         app.job?.company?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesStatus && matchesSearch;
    });
  };

  const allApplications = applications || [];
  const appliedApplications = filterApplications(allApplications, "applied");
  const interviewApplications = filterApplications(allApplications, "interview");
  const offerApplications = filterApplications(allApplications, "offer");
  const rejectedApplications = filterApplications(allApplications, "rejected");

  // Handle status change
  const handleStatusChange = (applicationId: number, newStatus: string) => {
    updateApplicationMutation.mutate({ id: applicationId, status: newStatus });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activePath={location} />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-heading font-bold text-[#2D3E50]">Application Tracking</h1>
            <Button className="bg-[#2D3E50]">
              <Plus className="mr-2 h-4 w-4" /> New Application
            </Button>
          </div>
          
          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search applications"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Application Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all">
                All ({allApplications.length})
              </TabsTrigger>
              <TabsTrigger value="applied">
                Applied ({appliedApplications.length})
              </TabsTrigger>
              <TabsTrigger value="interview">
                Interview ({interviewApplications.length})
              </TabsTrigger>
              <TabsTrigger value="offer">
                Offer ({offerApplications.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedApplications.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D3E50]"></div>
                </div>
              ) : allApplications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">No applications yet</h3>
                    <p className="text-gray-600 mb-4">Start applying to jobs to track your progress</p>
                    <Button className="bg-[#2D3E50]">Find Jobs</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {allApplications.map((application) => (
                    <Card key={application.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-3/4 p-6">
                            <ApplicationCard application={application} />
                          </div>
                          <div className="md:w-1/4 p-6 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200">
                            <h4 className="font-medium text-[#2D3E50] mb-3">Actions</h4>
                            <div className="space-y-2">
                              {application.status !== "applied" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full flex justify-start"
                                  onClick={() => handleStatusChange(application.id, "applied")}
                                >
                                  <FileText className="mr-2 h-4 w-4" /> Mark as Applied
                                </Button>
                              )}
                              {application.status !== "interview" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full flex justify-start"
                                  onClick={() => handleStatusChange(application.id, "interview")}
                                >
                                  <Calendar className="mr-2 h-4 w-4" /> Set Interview
                                </Button>
                              )}
                              {application.status !== "offer" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full flex justify-start text-green-600"
                                  onClick={() => handleStatusChange(application.id, "offer")}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" /> Mark as Offer
                                </Button>
                              )}
                              {application.status !== "rejected" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full flex justify-start text-red-600"
                                  onClick={() => handleStatusChange(application.id, "rejected")}
                                >
                                  <AlertCircle className="mr-2 h-4 w-4" /> Mark as Rejected
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="w-full flex justify-start text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            
            <TabsContent value="applied" className="mt-6">
              {appliedApplications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">No applied applications</h3>
                    <p className="text-gray-600">Apply to jobs to track them here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {appliedApplications.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-6">
                        <ApplicationCard application={application} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="interview" className="mt-6">
              {interviewApplications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">🗓️</div>
                    <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">No interviews scheduled</h3>
                    <p className="text-gray-600">Update application status when you get interview invitations</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {interviewApplications.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-6">
                        <ApplicationCard application={application} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="offer" className="mt-6">
              {offerApplications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">🎉</div>
                    <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">No offers yet</h3>
                    <p className="text-gray-600">Your offers will appear here when you receive them</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {offerApplications.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-6">
                        <ApplicationCard application={application} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-6">
              {rejectedApplications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-4">🙁</div>
                    <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">No rejected applications</h3>
                    <p className="text-gray-600">Keep track of rejections to improve your application strategy</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {rejectedApplications.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-6">
                        <ApplicationCard application={application} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Kanban Board - Mobile Hidden, Desktop Shown */}
          <div className="mt-12 hidden lg:block">
            <h2 className="text-xl font-semibold text-[#2D3E50] mb-4">Kanban Board View</h2>
            <div className="grid grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <span className="bg-blue-100 w-2 h-2 rounded-full mr-2"></span>
                    <CardTitle className="text-md font-medium">Applied ({appliedApplications.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {appliedApplications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <span className="bg-purple-100 w-2 h-2 rounded-full mr-2"></span>
                    <CardTitle className="text-md font-medium">Interview ({interviewApplications.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {interviewApplications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <span className="bg-green-100 w-2 h-2 rounded-full mr-2"></span>
                    <CardTitle className="text-md font-medium">Offer ({offerApplications.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {offerApplications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <span className="bg-red-100 w-2 h-2 rounded-full mr-2"></span>
                    <CardTitle className="text-md font-medium">Rejected ({rejectedApplications.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {rejectedApplications.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
