import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SkillsGap } from "@/components/dashboard/skills-gap";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { 
  Calendar, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  BarChart2, 
  ArrowUpRight,
  Download
} from "lucide-react";

// Mock userId for development (would come from auth context)
const userId = 1;

export default function Analytics() {
  const [location] = useLocation();
  const [timeRange, setTimeRange] = useState("month");

  // Fetch skills gap analysis
  const { data: skillsGapData, isLoading: isLoadingSkillsGap } = useQuery({
    queryKey: [`/api/users/${userId}/analyze-skills-gap`],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Mock application data for charts
  const applicationStatusData = [
    { name: 'Applied', value: 32, color: '#3B82F6' },
    { name: 'Interview', value: 8, color: '#8B5CF6' },
    { name: 'Offer', value: 2, color: '#22C55E' },
    { name: 'Rejected', value: 12, color: '#EF4444' },
  ];

  const weeklyApplicationsData = [
    { week: 'Week 1', applications: 10, interviews: 2 },
    { week: 'Week 2', applications: 15, interviews: 3 },
    { week: 'Week 3', applications: 8, interviews: 1 },
    { week: 'Week 4', applications: 12, interviews: 2 },
  ];

  const applicationSourcesData = [
    { name: 'LinkedIn', value: 40 },
    { name: 'Indeed', value: 30 },
    { name: 'Glassdoor', value: 15 },
    { name: 'Company Website', value: 10 },
    { name: 'Referral', value: 5 },
  ];

  const salaryComparisonData = [
    { position: 'Junior', market: 75000, your: 80000 },
    { position: 'Mid-level', market: 95000, your: 90000 },
    { position: 'Senior', market: 130000, your: 140000 },
    { position: 'Lead', market: 160000, your: 150000 },
  ];

  const responseRateData = [
    { date: 'Jan', rate: 15 },
    { date: 'Feb', rate: 18 },
    { date: 'Mar', rate: 25 },
    { date: 'Apr', rate: 30 },
    { date: 'May', rate: 35 },
    { date: 'Jun', rate: 40 },
  ];

  const skillsDemandData = [
    { name: 'React', score: 85 },
    { name: 'TypeScript', score: 78 },
    { name: 'Node.js', score: 65 },
    { name: 'Docker', score: 45 },
    { name: 'AWS', score: 50 },
    { name: 'GraphQL', score: 40 },
  ];

  const COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#EF4444', '#F59E0B', '#0EA5E9'];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activePath={location} />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-heading font-bold text-[#2D3E50]">Analytics Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Tabs defaultValue={timeRange} onValueChange={setTimeRange} className="w-auto">
                <TabsList>
                  <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
                  <TabsTrigger value="year" className="text-xs">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Applications</p>
                    <p className="text-2xl font-semibold text-[#2D3E50]">54</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart2 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">12%</span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Response Rate</p>
                    <p className="text-2xl font-semibold text-[#2D3E50]">38%</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <PieChartIcon className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">5%</span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Interview Rate</p>
                    <p className="text-2xl font-semibold text-[#2D3E50]">15%</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">8%</span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Avg. Match Score</p>
                    <p className="text-2xl font-semibold text-[#2D3E50]">85%</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <LineChartIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">3%</span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#2D3E50]">Application Success Rate</CardTitle>
                <CardDescription>
                  Track your application outcomes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyApplicationsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="applications" name="Applications" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="interviews" name="Interviews" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#2D3E50]">Application Status</CardTitle>
                <CardDescription>
                  Current status of all your job applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {applicationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#2D3E50]">Response Rate Trend</CardTitle>
                <CardDescription>
                  How your application response rate has changed over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={responseRateData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis unit="%" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }} 
                        formatter={(value) => [`${value}%`, 'Response Rate']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rate" 
                        name="Response Rate" 
                        stroke="#FFD700" 
                        fill="#FFD700" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#2D3E50]">Skills Demand Analysis</CardTitle>
                <CardDescription>
                  Demand for your skills in the current job market
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={skillsDemandData}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }} 
                        formatter={(value) => [`${value}%`, 'Demand Score']}
                      />
                      <Bar 
                        dataKey="score" 
                        name="Demand Score" 
                        fill="#4AC1BD" 
                        radius={[0, 4, 4, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#2D3E50]">Application Sources</CardTitle>
                <CardDescription>
                  Where your applications are coming from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationSourcesData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {applicationSourcesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#2D3E50]">Salary Comparison</CardTitle>
                <CardDescription>
                  Your target salary vs. market averages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salaryComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="position" />
                      <YAxis domain={[50000, 180000]} tickFormatter={(value) => `$${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }} 
                        formatter={(value) => [`$${value.toLocaleString()}`, '']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="market" 
                        name="Market Average" 
                        stroke="#3B82F6" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="your" 
                        name="Your Target" 
                        stroke="#FFD700" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Skills Gap Analysis */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#2D3E50]">Skills Gap Analysis</CardTitle>
                <CardDescription>
                  Improve your match rate by developing these skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSkillsGap ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D3E50]"></div>
                  </div>
                ) : skillsGapData?.missingSkills ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-3">Top skills to improve your match rate:</p>
                        <div className="space-y-3">
                          {skillsGapData.missingSkills.map((skill, index) => (
                            <div key={index}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-[#2D3E50] font-medium">{skill.name}</span>
                                <span className="text-gray-600">+{skill.impact}% match rate</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-[#FFD700] h-2 rounded-full" 
                                  style={{ width: `${skill.impact * 3}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-[#2D3E50] mb-3">Learning Resources</h3>
                        <div className="space-y-3">
                          <div className="bg-white p-3 rounded-md border border-gray-200">
                            <h4 className="font-medium text-[#2D3E50]">Docker Fundamentals</h4>
                            <p className="text-sm text-gray-600 mt-1">Learn Docker basics and container management</p>
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-xs text-gray-500">8 hours course</span>
                              <Button variant="link" className="p-0 h-auto text-[#4AC1BD] text-xs">View Course</Button>
                            </div>
                          </div>
                          
                          <div className="bg-white p-3 rounded-md border border-gray-200">
                            <h4 className="font-medium text-[#2D3E50]">AWS Cloud Practitioner</h4>
                            <p className="text-sm text-gray-600 mt-1">Comprehensive AWS basics and certification prep</p>
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-xs text-gray-500">20 hours course</span>
                              <Button variant="link" className="p-0 h-auto text-[#4AC1BD] text-xs">View Course</Button>
                            </div>
                          </div>
                          
                          <div className="bg-white p-3 rounded-md border border-gray-200">
                            <h4 className="font-medium text-[#2D3E50]">GraphQL Essentials</h4>
                            <p className="text-sm text-gray-600 mt-1">Modern API development with GraphQL</p>
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-xs text-gray-500">12 hours course</span>
                              <Button variant="link" className="p-0 h-auto text-[#4AC1BD] text-xs">View Course</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="font-medium text-[#2D3E50] mb-3">Impact on Application Success</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Based on our analysis, developing these skills could increase your application success rate by approximately 35%, 
                        and your interview rate by up to 40%. We recommend focusing on the highest impact skills first.
                      </p>
                      <Button className="bg-[#2D3E50]">View Personalized Learning Plan</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-600">No skills gap analysis available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
