import { Helmet } from "react-helmet";
import ProctorLayout from "@/components/layout/proctor-layout";
import ProctorDashboard from "@/components/dashboard/proctor-dashboard";
import { useAuth } from "@/hooks/use-auth";

const ProctorDashboardPage = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Proctor Dashboard | ProctorDiary</title>
        <meta name="description" content="Monitor student progress, and manage their queries in the ProctorDiary system." />
      </Helmet>
      
      <ProctorLayout>
        <div className="px-4 sm:px-0">
          <ProctorDashboard />
        </div>
      </ProctorLayout>
    </>
  );
};

export default ProctorDashboardPage;
