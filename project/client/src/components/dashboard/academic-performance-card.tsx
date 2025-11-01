import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { AcademicRecord } from "@shared/schema";
import { useLocation } from "wouter";

type AcademicPerformanceCardProps = {
  cgpa?: number;
  records?: AcademicRecord[];
};

export const AcademicPerformanceCard = ({ cgpa = 0, records = [] }: AcademicPerformanceCardProps) => {
  const [, setLocation] = useLocation();
  
  // Sort and get the most recent records for display
  const latestRecords = [...records]
    .sort((a, b) => b.semester - a.semester)
    .slice(0, 3);
  
  // Calculate CGPA change (this would need actual previous semester data in production)
  const cgpaChange = 0.2; // Example value
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-500">Academic Performance</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-primary">{cgpa.toFixed(1)}</p>
            <p className="text-sm text-gray-400">Current CGPA</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${cgpaChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {cgpaChange >= 0 ? '+' : ''}{cgpaChange.toFixed(1)}
            </p>
            <p className="text-xs text-gray-400">from last semester</p>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          {latestRecords.map(record => {
            // Calculate displayed score based on what's available
            let score = "N/A";
            let scoreClass = "text-gray-400";
            
            if (record.semesterMarks) {
              const percentage = record.semesterMarks;
              score = `${percentage}/100`;
              scoreClass = percentage >= 80 
                ? 'text-green-600' 
                : percentage >= 70 
                  ? 'text-amber-600' 
                  : 'text-red-600';
            }
            
            return (
              <div key={record.id} className="flex justify-between items-center">
                <span className="text-sm text-gray-400">{record.courseName}</span>
                <span className={`text-sm font-medium ${scoreClass}`}>{score}</span>
              </div>
            );
          })}

          {latestRecords.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              No academic records available
            </div>
          )}
        </div>
        
        <CardFooter className="mt-4 px-0 flex justify-end">
          <Button 
            variant="ghost" 
            className="text-primary hover:bg-blue-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={() => setLocation('/student/academic')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Full Report
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};
