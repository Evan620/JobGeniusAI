import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { AiSettings } from "@shared/schema";
import {
  Settings,
  Bot,
  Sparkles,
  Send,
  FileEdit,
  BarChart,
  Search,
  Clock,
  Shield,
  AlertCircle,
} from "lucide-react";

// Mock userId for development (would come from auth context)
const userId = 1;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiControl() {
  const [location] = useLocation();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI job assistant. I can help you find jobs, optimize your resume, prepare for interviews, and more. What can I help you with today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Fetch AI settings
  const { data: aiSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: [`/api/users/${userId}/ai-settings`],
    staleTime: 1000 * 60 * 5, // 5 minutes
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: inputMessage };
    setChatMessages([...chatMessages, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    try {
      // Send message to AI
      const response = await apiRequest('POST', '/api/ai-chat', {
        message: inputMessage,
        previousMessages: chatMessages
      });
      
      const data = await response.json();
      
      // Add AI response to chat
      setTimeout(() => {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message to AI assistant",
        variant: "destructive"
      });
      setIsTyping(false);
    }
  };

  const handleSettingChange = (key: keyof AiSettings, value: boolean | number) => {
    if (!aiSettings) return;
    updateAiSettingsMutation.mutate({ [key]: value });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activePath={location} />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-heading font-bold text-[#2D3E50] mb-6">AI Control Room</h1>
          
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <Bot className="h-4 w-4" /> AI Chat Assistant
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> AI Settings
              </TabsTrigger>
              <TabsTrigger value="resume" className="flex items-center gap-2">
                <FileEdit className="h-4 w-4" /> Resume Optimization
              </TabsTrigger>
            </TabsList>
            
            {/* AI Chat Assistant */}
            <TabsContent value="chat" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="h-[70vh]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-[#2D3E50]">
                        <div className="flex items-center gap-2">
                          <Bot className="h-5 w-5" />
                          JobGenius AI Assistant
                        </div>
                      </CardTitle>
                      <CardDescription>
                        Ask me anything about your job search or applications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4">
                      <ScrollArea className="h-[calc(70vh-180px)] pr-4">
                        {chatMessages.map((msg, index) => (
                          <div 
                            key={index} 
                            className={`flex items-start mb-4 ${msg.role === 'user' ? "justify-end" : ""}`}
                          >
                            {msg.role === 'assistant' && (
                              <div className="w-8 h-8 rounded-full bg-[#4AC1BD] flex items-center justify-center flex-shrink-0 text-white">
                                <Bot className="h-4 w-4" />
                              </div>
                            )}
                            <div 
                              className={`p-3 rounded-lg max-w-[80%] ${
                                msg.role === 'assistant' 
                                  ? "ml-2 bg-white border border-gray-200" 
                                  : "mr-2 bg-[#2D3E50] text-white"
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                            </div>
                            {msg.role === 'user' && (
                              <div className="w-8 h-8 rounded-full bg-[#2D3E50] flex items-center justify-center flex-shrink-0 text-white">
                                <span className="text-sm">You</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex items-start mb-4">
                            <div className="w-8 h-8 rounded-full bg-[#4AC1BD] flex items-center justify-center flex-shrink-0 text-white">
                              <Bot className="h-4 w-4" />
                            </div>
                            <div className="ml-2 p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-100"></div>
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-200"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex w-full gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-grow"
                        />
                        <Button 
                          onClick={handleSendMessage} 
                          className="bg-[#2D3E50]"
                          disabled={isTyping || !inputMessage.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-[#2D3E50]">AI Capabilities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Sparkles className="h-4 w-4 mr-2 text-[#FFD700]" />
                          <span className="font-medium text-[#2D3E50]">Job Matching</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          I can analyze your skills and experience to find the best matching jobs from multiple sources.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <FileEdit className="h-4 w-4 mr-2 text-[#FFD700]" />
                          <span className="font-medium text-[#2D3E50]">Resume Optimization</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          I'll tailor your resume for each job application to improve your chances of getting interviews.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <BarChart className="h-4 w-4 mr-2 text-[#FFD700]" />
                          <span className="font-medium text-[#2D3E50]">Skills Analysis</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          I can identify skill gaps and provide recommendations to make you more competitive.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Search className="h-4 w-4 mr-2 text-[#FFD700]" />
                          <span className="font-medium text-[#2D3E50]">Job Search Automation</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          I'll continuously search job boards and alert you to new relevant positions.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* AI Settings */}
            <TabsContent value="settings" className="mt-6">
              {isLoadingSettings ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D3E50]"></div>
                </div>
              ) : aiSettings ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-[#2D3E50]">Automation Settings</CardTitle>
                      <CardDescription>
                        Configure how the AI agent works for you
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="auto-apply" className="text-[#2D3E50] font-medium">Auto-apply to jobs</Label>
                            <p className="text-sm text-gray-600">When enabled, AI will automatically apply to jobs that meet your criteria</p>
                          </div>
                          <Switch 
                            id="auto-apply" 
                            checked={aiSettings.autoApply}
                            onCheckedChange={(checked) => handleSettingChange('autoApply', checked)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="match-threshold" className="text-[#2D3E50] font-medium">Match threshold</Label>
                            <span className="text-sm font-medium text-[#2D3E50]">{aiSettings.matchThreshold}%</span>
                          </div>
                          <Slider
                            id="match-threshold"
                            defaultValue={[aiSettings.matchThreshold]}
                            max={100}
                            step={5}
                            onValueChange={(values) => handleSettingChange('matchThreshold', values[0])}
                          />
                          <p className="text-sm text-gray-600">Only auto-apply to jobs with match score above this threshold</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="customize-resumes" className="text-[#2D3E50] font-medium">Customize resumes for each job</Label>
                            <p className="text-sm text-gray-600">AI will tailor your resume for each application</p>
                          </div>
                          <Switch 
                            id="customize-resumes" 
                            checked={aiSettings.customizeResumes}
                            onCheckedChange={(checked) => handleSettingChange('customizeResumes', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="daily-alerts" className="text-[#2D3E50] font-medium">Daily job search alerts</Label>
                            <p className="text-sm text-gray-600">Receive daily updates about new job matches</p>
                          </div>
                          <Switch 
                            id="daily-alerts" 
                            checked={aiSettings.dailyAlerts}
                            onCheckedChange={(checked) => handleSettingChange('dailyAlerts', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-[#2D3E50]">AI Job Search Status</CardTitle>
                      <CardDescription>
                        Current status of AI-powered job search
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-[#4AC1BD]" />
                          <span className="font-medium text-[#2D3E50]">Last Run: 2 hours ago</span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Job boards scraped</span>
                              <span className="text-[#2D3E50] font-medium">3/4</span>
                            </div>
                            <Progress value={75} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Jobs analyzed</span>
                              <span className="text-[#2D3E50] font-medium">128/150</span>
                            </div>
                            <Progress value={85} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Auto-applications</span>
                              <span className="text-[#2D3E50] font-medium">8/10</span>
                            </div>
                            <Progress value={80} className="h-1.5" />
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <h3 className="font-medium text-[#2D3E50] mb-2">Recent Activity</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start">
                              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mt-1 mr-2 flex-shrink-0">
                                <Sparkles className="h-2 w-2 text-green-600" />
                              </div>
                              <div>
                                <p className="text-gray-700">Found 12 new job matches</p>
                                <p className="text-gray-500 text-xs">Today at 9:30 AM</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center mt-1 mr-2 flex-shrink-0">
                                <Send className="h-2 w-2 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-gray-700">Applied to 3 jobs above threshold</p>
                                <p className="text-gray-500 text-xs">Yesterday at 2:15 PM</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center mt-1 mr-2 flex-shrink-0">
                                <FileEdit className="h-2 w-2 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-gray-700">Optimized 5 resumes for new applications</p>
                                <p className="text-gray-500 text-xs">Yesterday at 1:30 PM</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-[#2D3E50]">
                        Run Job Search Now
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-[#2D3E50]">Privacy & Security</CardTitle>
                      <CardDescription>
                        Control how your data is used
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start">
                          <Shield className="h-5 w-5 mr-2 text-[#2D3E50] mt-0.5" />
                          <div>
                            <p className="font-medium text-[#2D3E50]">Data Protection</p>
                            <p className="text-sm text-gray-600">Your resume and personal information are encrypted and secure</p>
                          </div>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-start">
                          <Shield className="h-5 w-5 mr-2 text-[#2D3E50] mt-0.5" />
                          <div>
                            <p className="font-medium text-[#2D3E50]">Allow AI to learn from my applications</p>
                            <p className="text-sm text-gray-600">Improve AI performance by learning from your successful applications</p>
                          </div>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-start">
                          <Shield className="h-5 w-5 mr-2 text-[#2D3E50] mt-0.5" />
                          <div>
                            <p className="font-medium text-[#2D3E50]">Share anonymous insights</p>
                            <p className="text-sm text-gray-600">Contribute to improving job market insights</p>
                          </div>
                        </div>
                        <Switch defaultChecked={false} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-[#2D3E50]">AI Preferences</CardTitle>
                      <CardDescription>
                        Set your preferences for AI behavior
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[#2D3E50] font-medium">Job search frequency</Label>
                        <select className="w-full p-2 border border-gray-300 rounded-md">
                          <option>Daily</option>
                          <option>Twice a week</option>
                          <option>Weekly</option>
                          <option>Manual only</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[#2D3E50] font-medium">Communication style</Label>
                        <select className="w-full p-2 border border-gray-300 rounded-md">
                          <option>Professional</option>
                          <option>Casual</option>
                          <option>Detailed</option>
                          <option>Concise</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[#2D3E50] font-medium">Notification preferences</Label>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">Email notifications</span>
                          <Switch defaultChecked={true} />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">Browser notifications</span>
                          <Switch defaultChecked={true} />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-[#2D3E50]">
                        Save Preferences
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">Unable to load settings</h3>
                    <p className="text-gray-600 mb-4">There was a problem loading your AI settings</p>
                    <Button className="bg-[#2D3E50]">Retry</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Resume Optimization */}
            <TabsContent value="resume" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-[#2D3E50]">Resume Optimization</CardTitle>
                    <CardDescription>
                      Let AI enhance your resume for specific job applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-description">Job Description</Label>
                      <Textarea 
                        id="job-description" 
                        placeholder="Paste the job description here"
                        rows={6}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="resume-select">Select Resume</Label>
                      <select id="resume-select" className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="default">My Default Resume</option>
                        <option value="tech">Tech Industry Resume</option>
                        <option value="marketing">Marketing Resume</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="keywords-extraction" className="text-[#2D3E50] font-medium">Extract keywords from job</Label>
                        <p className="text-sm text-gray-600">AI will identify key skills and requirements</p>
                      </div>
                      <Switch id="keywords-extraction" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="ats-optimize" className="text-[#2D3E50] font-medium">ATS optimization</Label>
                        <p className="text-sm text-gray-600">Format resume for applicant tracking systems</p>
                      </div>
                      <Switch id="ats-optimize" defaultChecked />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-[#2D3E50]">
                      <Sparkles className="mr-2 h-4 w-4" /> Optimize Resume
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-[#2D3E50]">Optimization Preview</CardTitle>
                    <CardDescription>
                      See how AI will enhance your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="font-medium text-[#2D3E50] mb-2">Keyword Matching</h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-gray-600">Your resume contains:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">React.js</span>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">TypeScript</span>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">UI/UX</span>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">JavaScript</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Missing keywords:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Redux</span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Docker</span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">AWS</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="font-medium text-[#2D3E50] mb-2">Optimization Recommendations</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start">
                            <span className="text-[#4AC1BD] mr-1">•</span>
                            Add specific project achievements with metrics
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#4AC1BD] mr-1">•</span>
                            Highlight experience with Redux state management
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#4AC1BD] mr-1">•</span>
                            Mention any AWS cloud experience, even if limited
                          </li>
                          <li className="flex items-start">
                            <span className="text-[#4AC1BD] mr-1">•</span>
                            Reorganize skills section for better visibility
                          </li>
                        </ul>
                      </div>
                      
                      <div className="border p-4 rounded-md">
                        <p className="text-sm text-gray-600 italic">
                          After optimization, your resume's estimated match score will be approximately 92% (from current 78%)
                        </p>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Current match</span>
                            <span className="text-[#2D3E50] font-medium">78%</span>
                          </div>
                          <Progress value={78} className="h-1.5 bg-gray-200" />
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">After optimization</span>
                            <span className="text-[#2D3E50] font-medium">92%</span>
                          </div>
                          <Progress value={92} className="h-1.5 bg-green-200" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
