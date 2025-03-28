import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Job, InsertApplication } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface JobCardProps {
  job: Job;
  matchScore: number;
  matchReasons: string[];
  onSwipe?: (direction: 'left' | 'right') => void;
  style?: React.CSSProperties;
  zIndex?: number;
}

export function JobCard({ 
  job, 
  matchScore, 
  matchReasons, 
  onSwipe,
  style,
  zIndex = 1
}: JobCardProps) {
  const [, navigate] = useLocation();
  const [swiping, setSwiping] = useState<'left' | 'right' | null>(null);
  const [applying, setApplying] = useState(false);

  const handleSwipe = async (direction: 'left' | 'right') => {
    setSwiping(direction);
    
    if (direction === 'right') {
      setApplying(true);
      
      try {
        // Create application for this job
        const application: InsertApplication = {
          userId: 1, // Would get from auth context
          jobId: job.id,
          status: "applied",
          aiOptimized: true
        };
        
        await apiRequest('POST', '/api/applications', application);
        
        // Invalidate applications cache
        queryClient.invalidateQueries({ queryKey: ['/api/users/1/applications'] });
        
        toast({
          title: "Application Started!",
          description: "AI is preparing your customized resume",
          variant: "success"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to apply for job",
          variant: "destructive"
        });
      } finally {
        setApplying(false);
      }
    }
    
    // Notify parent component about swipe
    if (onSwipe) {
      setTimeout(() => {
        onSwipe(direction);
      }, 300);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        style={{
          ...style,
          zIndex
        }}
        animate={swiping ? {
          x: swiping === 'left' ? -500 : 500,
          rotate: swiping === 'left' ? -10 : 10,
          opacity: 0
        } : {
          x: 0,
          rotate: 0,
          opacity: 1
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        className="absolute top-0 left-0 w-full"
      >
        <Card className="job-card border border-gray-200 overflow-hidden">
          <div className="h-24 bg-[#2D3E50] relative">
            <div className="absolute inset-0 opacity-25 bg-gradient-to-r from-[#2D3E50] to-[#4A5568]"></div>
            <div className="absolute top-4 left-4 flex items-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="font-heading font-bold text-xl text-[#2D3E50]">
                  {job.company.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 text-white">
                <p className="font-medium">{job.company}</p>
                <p className="text-xs opacity-80">{job.location}</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-heading font-bold text-[#2D3E50]">{job.title}</h3>
              <Badge variant="outline" className={job.jobType === 'Remote' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                {job.jobType}
              </Badge>
            </div>
            
            <div className="flex items-center mb-4">
              <span className="text-gray-600 text-sm mr-2">Match score:</span>
              <Progress value={matchScore} className="h-2.5 w-full" />
              <span className="ml-2 font-bold text-[#2D3E50]">{matchScore}%</span>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-[#2D3E50] mb-2">AI Insights:</h4>
              <p className="text-sm text-gray-600">{matchReasons[0]}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {job.skills?.map((skill, index) => (
                <Badge key={index} variant="outline" className="bg-[#4AC1BD] bg-opacity-10 text-[#4AC1BD]">
                  {skill}
                </Badge>
              ))}
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium text-[#2D3E50]">{job.salary}</span>
                <span className="text-sm text-gray-600"> / year</span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  disabled={applying}
                  variant="outline" 
                  size="icon" 
                  className="rounded-full bg-red-100 hover:bg-red-200 text-red-500"
                  onClick={() => handleSwipe('left')}
                >
                  <ThumbsDown className="h-5 w-5" />
                </Button>
                <Button 
                  disabled={applying}
                  variant="outline" 
                  size="icon" 
                  className="rounded-full bg-green-100 hover:bg-green-200 text-green-500"
                  onClick={() => handleSwipe('right')}
                >
                  <ThumbsUp className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
