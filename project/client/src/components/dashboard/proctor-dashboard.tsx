import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "./stats-card";
import { StudentListTable } from "./student-list-table";
import { QueryCard } from "./query-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, GraduationCap, ClipboardCheck, AlertTriangle, HelpCircle } from "lucide-react";

interface Student {
  id: number;
  userId: number;
  name: string;
  email: string;
  studentId: string;
  department: string;
  semester: number;
  attendance: {
    percentage: number;
    total: number;
    present: number;
  };
  cgpa: number;
}

interface StudentsResponse {
  students: Student[];
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

const ProctorDashboard = () => {
  const { 
    data: profileData,
    isLoading: profileLoading,
    error: profileError
  } = useQuery({
    queryKey: ["/api/profile"],
  });

  const { 
    data: studentsData, 
    isLoading: studentsLoading,
    error: studentsError
  } = useQuery<StudentsResponse>({
    queryKey: ["/api/proctor/students"],
  });

  const { 
    data: queriesData, 
    isLoading: queriesLoading,
    error: queriesError
  } = useQuery<QueriesResponse>({
    queryKey: ["/api/proctor/queries"],
  });

  if (profileError || studentsError || queriesError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {profileError?.message || studentsError?.message || queriesError?.message || "Failed to load dashboard data"}
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate summary statistics
  const totalStudents = studentsData?.students?.length || 0;
  const goodAttendance = studentsData?.students?.filter(s => s.attendance.percentage >= 75).length || 0;
  const atRisk = studentsData?.students?.filter(s => s.attendance.percentage < 75 || s.cgpa < 6.0).length || 0;
  const pendingQueries = queriesData?.queries?.filter(q => q.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-semibold text-gray-500">Proctor Dashboard</h2>
        <p className="mt-1 text-sm text-gray-400">
          Welcome. You have {totalStudents || '...'} students assigned to you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Summary Cards */}
        {profileLoading ? (
          <>
            <Skeleton className="h-[100px] rounded-lg" />
            <Skeleton className="h-[100px] rounded-lg" />
            <Skeleton className="h-[100px] rounded-lg" />
            <Skeleton className="h-[100px] rounded-lg" />
          </>
        ) : (
          <>
            <StatsCard 
              title="Total Students"
              value={totalStudents}
              icon={<GraduationCap />}
              color="blue"
            />
            <StatsCard
              title="Good Attendance"
              value={goodAttendance}
              icon={<ClipboardCheck />}
              color="green"
            />
            <StatsCard
              title="At Risk"
              value={atRisk}
              icon={<AlertTriangle />}
              color="amber"
            />
            <StatsCard
              title="Pending Queries"
              value={pendingQueries}
              icon={<HelpCircle />}
              color="red"
            />
          </>
        )}

        {/* Student List */}
        {studentsLoading ? (
          <Skeleton className="h-[400px] w-full rounded-lg md:col-span-2 lg:col-span-3" />
        ) : (
          <StudentListTable 
            students={studentsData?.students || []} 
            loading={studentsLoading} 
            className="md:col-span-2 lg:col-span-3"
          />
        )}

        {/* Recent Queries */}
        {queriesLoading ? (
          <Skeleton className="h-[400px] rounded-lg md:col-span-2 lg:col-span-1" />
        ) : (
          <QueryCard 
            queries={queriesData?.queries?.slice(0, 3) || []}
            loading={queriesLoading} 
            className="md:col-span-2 lg:col-span-1"
          />
        )}
      </div>
    </div>
  );
};

export default ProctorDashboard;
