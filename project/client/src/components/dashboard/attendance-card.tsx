import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { useLocation } from "wouter";

type CourseAttendance = {
  total: number;
  present: number;
  percentage: number;
};

type AttendanceCardProps = {
  attendance?: {
    total: number;
    present: number;
    percentage: number;
  };
  courseWise?: Record<string, CourseAttendance>;
};

export const AttendanceCard = ({ attendance, courseWise = {} }: AttendanceCardProps) => {
  const [, setLocation] = useLocation();
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-500">Attendance Overview</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-5">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-400">Overall Attendance</span>
            <span className={`text-sm font-medium ${
              (attendance?.percentage ?? 0) >= 75 
                ? 'text-green-600' 
                : (attendance?.percentage ?? 0) >= 60 
                  ? 'text-amber-600' 
                  : 'text-red-600'
            }`}>
              {attendance?.percentage ?? 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                (attendance?.percentage ?? 0) >= 75 
                  ? 'bg-green-500' 
                  : (attendance?.percentage ?? 0) >= 60 
                    ? 'bg-amber-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${attendance?.percentage ?? 0}%` }}
            ></div>
          </div>
        </div>
        
        <div className="space-y-3">
          {Object.entries(courseWise).map(([course, data]) => (
            <div key={course} className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{course}</span>
              <span className={`text-sm font-medium ${
                data.percentage >= 75 
                  ? 'text-green-600' 
                  : data.percentage >= 60 
                    ? 'text-amber-600' 
                    : 'text-red-600'
              }`}>
                {data.percentage}%
              </span>
            </div>
          ))}

          {Object.keys(courseWise).length === 0 && (
            <div className="text-center py-6 text-gray-400">
              No attendance records available
            </div>
          )}
        </div>
        
        <CardFooter className="mt-4 px-0 flex justify-end">
          <Button 
            variant="ghost" 
            className="text-primary hover:bg-blue-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={() => setLocation('/student/attendance')}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};
