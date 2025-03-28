import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const [location] = useLocation();
  const [skills, setSkills] = useState([
    { id: 1, name: "React", level: 4 },
    { id: 2, name: "TypeScript", level: 3 },
    { id: 3, name: "JavaScript", level: 5 },
    { id: 4, name: "CSS", level: 4 },
    { id: 5, name: "HTML", level: 5 },
    { id: 6, name: "Node.js", level: 3 },
  ]);
  const [newSkill, setNewSkill] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    const exists = skills.some(
      (skill) => skill.name.toLowerCase() === newSkill.toLowerCase()
    );
    
    if (exists) {
      toast({
        title: "Skill already exists",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would make an API call
    setSkills([...skills, { id: Date.now(), name: newSkill, level: 3 }]);
    setNewSkill("");
    
    toast({
      title: "Skill added",
      description: `${newSkill} added to your profile`,
    });
  };

  const handleRemoveSkill = (id: number) => {
    // In a real app, this would make an API call
    setSkills(skills.filter((skill) => skill.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleUploadResume = () => {
    if (!selectedFile) return;
    
    // In a real app, this would make an API call to upload the file
    toast({
      title: "Resume uploaded",
      description: "Your resume has been uploaded successfully",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activePath={location} />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <h1 className="text-2xl font-heading font-bold text-[#2D3E50] mb-6">Your Profile</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Personal Information */}
              <div className="col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" defaultValue="Alex Johnson" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" defaultValue="alex@example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" defaultValue="(555) 123-4567" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" defaultValue="San Francisco, CA" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="headline">Professional Headline</Label>
                        <Input 
                          id="headline" 
                          defaultValue="Senior Frontend Developer with 5 years of experience" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="summary">Professional Summary</Label>
                        <Textarea 
                          id="summary" 
                          rows={4}
                          defaultValue="Frontend developer with extensive experience in React and TypeScript. Passionate about creating beautiful, responsive interfaces and optimizing user experiences."
                        />
                      </div>
                      
                      <Button className="bg-[#2D3E50]">Save Changes</Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Skills */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>
                      Add skills to help match you with the right jobs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {skills.map((skill) => (
                        <Badge 
                          key={skill.id}
                          variant="outline"
                          className="py-1.5 px-3 bg-[#4AC1BD] bg-opacity-10 text-[#4AC1BD]"
                        >
                          {skill.name}
                          <button 
                            className="ml-1" 
                            onClick={() => handleRemoveSkill(skill.id)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill (e.g. JavaScript, Project Management)"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                      />
                      <Button onClick={handleAddSkill} className="bg-[#2D3E50]">
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Resume and Documents */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Resume & Documents</CardTitle>
                    <CardDescription>
                      Upload your resume for AI optimization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Drag and drop your resume PDF or click to browse
                        </p>
                        <input
                          type="file"
                          id="resume-upload"
                          accept=".pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('resume-upload')?.click()}
                          className="mt-2"
                        >
                          Browse
                        </Button>
                      </div>
                      
                      {selectedFile && (
                        <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                          <div>
                            <p className="font-medium text-[#2D3E50]">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button onClick={handleUploadResume} className="bg-[#2D3E50]">
                            Upload
                          </Button>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="font-medium text-[#2D3E50] mb-2">Your Documents</h3>
                        <ul className="space-y-2">
                          <li className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                            <div>
                              <p className="font-medium text-[#2D3E50]">Alex_Johnson_Resume.pdf</p>
                              <p className="text-xs text-gray-500">Uploaded 2 weeks ago</p>
                            </div>
                            <Button variant="outline" size="sm">View</Button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Job Preferences</CardTitle>
                    <CardDescription>
                      Set your job search preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="job-title">Desired Job Title</Label>
                        <Input id="job-title" defaultValue="Frontend Developer" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="job-type">Job Type</Label>
                        <select 
                          id="job-type" 
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Contract</option>
                          <option>Freelance</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="salary">Desired Salary</Label>
                        <Input id="salary" defaultValue="$120,000" />
                      </div>
                      
                      <Button className="bg-[#2D3E50]">Save Preferences</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
