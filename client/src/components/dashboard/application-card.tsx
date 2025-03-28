import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Application, Job } from "@shared/schema";
import { format } from "date-fns";

interface ApplicationCardProps {
  application: Application & { job?: Job };
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const getStatusBadgeStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const job = application.job;
  if (!job) return null;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <Card className="kanban-card bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between">
        <span className="font-medium text-[#2D3E50]">{job.title}</span>
        <Badge variant="outline" className={getStatusBadgeStyles(application.status)}>
          {application.status}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 mt-1">{job.company}</p>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Applied {formatDate(application.appliedAt)}</span>
        <span>{application.aiOptimized ? 'AI-optimized' : 'Standard'}</span>
      </div>
      {application.interviewDate && (
        <div className="mt-2 text-xs font-medium text-purple-700">
          Interview on {formatDate(application.interviewDate)}
        </div>
      )}
      {application.notes && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
          {application.notes}
        </div>
      )}
    </Card>
  );
}
