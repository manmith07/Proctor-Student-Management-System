import { Helmet } from "react-helmet";
import StudentLayout from "@/components/layout/student-layout";
import StudentDashboard from "@/components/dashboard/student-dashboard";
import { useAuth } from "@/hooks/use-auth";

const StudentDashboardPage = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Student Dashboard | ProctorDiary</title>
        <meta name="description" content="View your academic progress, attendance, and queries at a glance in the ProctorDiary student dashboard." />
      </Helmet>
      
      <StudentLayout>
        <div className="px-4 sm:px-0">
          <StudentDashboard />
        </div>
      </StudentLayout>
    </>
  );
};

export default StudentDashboardPage;
