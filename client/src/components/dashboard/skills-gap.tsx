import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface SkillGap {
  name: string;
  impact: number;
}

interface SkillsGapProps {
  skillGaps: SkillGap[];
}

export function SkillsGap({ skillGaps }: SkillsGapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-[#2D3E50]">Skills Gap Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">Top skills to improve your match rate:</p>
        <div className="space-y-3">
          {skillGaps.map((skill, index) => (
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
        <div className="mt-4">
          <Button variant="link" className="text-[#4AC1BD] hover:text-opacity-80 text-sm font-medium p-0 h-auto">
            View recommended resources <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
