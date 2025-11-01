import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type StatsCardProps = {
  title: string;
  value: number;
  icon: ReactNode;
  color: "blue" | "green" | "amber" | "red";
};

export const StatsCard = ({ title, value, icon, color }: StatsCardProps) => {
  const colorMap = {
    blue: {
      bg: "bg-blue-100",
      text: "text-primary"
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600"
    },
    amber: {
      bg: "bg-amber-100",
      text: "text-amber-600"
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-600"
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorMap[color].bg} ${colorMap[color].text}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-500">{value}</p>
        </div>
      </div>
    </Card>
  );
};
