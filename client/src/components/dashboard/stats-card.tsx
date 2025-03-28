import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export function StatsCard({ title, value, icon: Icon, iconColor, iconBgColor }: StatsCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center">
        <div className={`rounded-md ${iconBgColor} bg-opacity-10 p-3`}>
          <Icon className={`${iconColor} text-2xl h-6 w-6`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-[#2D3E50]">{value}</p>
        </div>
      </div>
    </div>
  );
}
