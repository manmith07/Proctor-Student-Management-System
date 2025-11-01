import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import AuthForm from "@/components/auth/auth-form";
import { Helmet } from "react-helmet";

const AuthPage = () => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      if (user.role === "student") {
        setLocation("/student");
      } else if (user.role === "proctor") {
        setLocation("/proctor");
      }
    }
  }, [user, isLoading, setLocation]);

  return (
    <>
      <Helmet>
        <title>Login | ProctorDiary - Academic Mentoring System</title>
        <meta name="description" content="Log in to the ProctorDiary Academic Mentoring System. Select your role as a student or proctor to access the dashboard." />
      </Helmet>
      
      <div className="min-h-screen flex md:bg-gray-100">
        {/* Auth Form Column */}
        <div className="flex-1 flex items-center justify-center p-4">
          <AuthForm />
        </div>

        {/* Hero Column - Hidden on mobile */}
        <div className="hidden md:flex flex-1 flex-col justify-center bg-primary p-12 text-white">
          <div className="max-w-md mx-auto">
            <h1 className="text-4xl font-bold mb-4 font-heading">ProctorDiary</h1>
            <h2 className="text-2xl font-semibold mb-6">Academic Mentoring Management System</h2>
            
            <p className="mb-8 text-blue-100">
              A comprehensive platform that bridges the gap between students and their academic mentors, 
              enabling better communication, academic tracking, and support.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-blue-600 p-2 rounded-full mr-3 mt-1">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Academic Tracking</h3>
                  <p className="text-blue-100">Monitor attendance and performance with real-time updates.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-600 p-2 rounded-full mr-3 mt-1">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Direct Communication</h3>
                  <p className="text-blue-100">Raise queries and get responses from your proctor.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-600 p-2 rounded-full mr-3 mt-1">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Secure & Role-Based</h3>
                  <p className="text-blue-100">Dedicated dashboards and access controls for students and proctors.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
