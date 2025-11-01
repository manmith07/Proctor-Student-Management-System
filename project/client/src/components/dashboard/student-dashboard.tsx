import { useQuery } from "@tanstack/react-query";
import { ProctorInfoCard } from "./proctor-info-card";
import { AttendanceCard } from "./attendance-card";
import { AcademicPerformanceCard } from "./academic-performance-card";
import { QueriesTable } from "./queries-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ProctorInfo {
  id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
}

interface ProfileResponse {
  proctor: ProctorInfo;
}

interface CourseAttendance {
  percentage: number;
  total: number;
  present: number;
}

interface AttendanceResponse {
  overall: CourseAttendance;
  courseWise: Record<string, CourseAttendance>;
}

interface AcademicRecord {
  id: number;
  studentId: number;
  semester: number;
  courseId: string;
  courseName: string;
  internalMarks: number | null;
  quizMarks: number | null;
  projectMarks: number | null;
  semesterMarks: number | null;
  CGPA: number | null;
}

interface AcademicResponse {
  cgpa: number;
  records: AcademicRecord[];
}

interface Query {
  id: number;
  createdAt: Date;
  studentId: number;
  proctorId: number;
  subject: string;
  description: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  updatedAt: Date;
}

interface QueriesResponse {
  queries: Query[];
}

const StudentDashboard = () => {
  const { 
    data: profileData, 
    isLoading: profileLoading,
    error: profileError
  } = useQuery<ProfileResponse>({
    queryKey: ["/api/profile"],
  });

  const { 
    data: attendanceData, 
    isLoading: attendanceLoading,
    error: attendanceError
  } = useQuery<AttendanceResponse>({
    queryKey: ["/api/student/attendance"],
  });

  const { 
    data: academicData, 
    isLoading: academicLoading,
    error: academicError
  } = useQuery<AcademicResponse>({
    queryKey: ["/api/student/academic"],
  });

  const { 
    data: queriesData, 
    isLoading: queriesLoading,
    error: queriesError
  } = useQuery<QueriesResponse>({
    queryKey: ["/api/student/queries"],
  });

  if (profileError || attendanceError || academicError || queriesError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {profileError?.message || attendanceError?.message || academicError?.message || queriesError?.message || "Failed to load dashboard data"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-semibold text-gray-500">Student Dashboard</h2>
        <p className="mt-1 text-sm text-gray-400">Welcome back. Here's your academic overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profileLoading ? (
          <Skeleton className="h-[250px] rounded-lg" />
        ) : (
          <ProctorInfoCard proctor={profileData?.proctor} />
        )}

        {attendanceLoading ? (
          <Skeleton className="h-[250px] rounded-lg" />
        ) : (
          <AttendanceCard attendance={attendanceData?.overall} courseWise={attendanceData?.courseWise} />
        )}

        {academicLoading ? (
          <Skeleton className="h-[250px] rounded-lg" />
        ) : (
          <AcademicPerformanceCard cgpa={academicData?.cgpa} records={academicData?.records} />
        )}

        {queriesLoading ? (
          <Skeleton className="h-[350px] w-full rounded-lg md:col-span-3" />
        ) : (
          <QueriesTable 
            queries={queriesData?.queries || []} 
            loading={queriesLoading} 
            className="md:col-span-3"
          />
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
