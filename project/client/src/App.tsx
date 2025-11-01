import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Helmet } from "react-helmet";

// Pages
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// Student pages
import StudentDashboardPage from "@/pages/student/dashboard";
import StudentAttendancePage from "@/pages/student/attendance";
import StudentAcademicPage from "@/pages/student/academic";
import StudentQueriesPage from "@/pages/student/queries";

// Proctor pages
import ProctorDashboardPage from "@/pages/proctor/dashboard";
import ProctorStudentsPage from "@/pages/proctor/students";
import ProctorAttendancePage from "@/pages/proctor/attendance";
import ProctorQueriesPage from "@/pages/proctor/queries";
import ProctorReportsPage from "@/pages/proctor/reports";
import StudentDetailsPage from "@/pages/proctor/student/[id]";

function Router() {
  const [location] = useLocation();
  
  // Determine the base title based on the current route
  let baseTitle = "ProctorDiary - Academic Mentoring System";
  if (location.startsWith("/student")) {
    baseTitle = "Student Portal | ProctorDiary";
  } else if (location.startsWith("/proctor")) {
    baseTitle = "Proctor Portal | ProctorDiary";
  }

  return (
    <>
      <Helmet>
        <title>{baseTitle}</title>
        <meta name="description" content="ProctorDiary - Academic Mentoring Management System for educational institutions" />
      </Helmet>

      <Switch>
        {/* Auth */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Student Routes */}
        <ProtectedRoute path="/student" component={StudentDashboardPage} roles={['student']} />
        <ProtectedRoute path="/student/attendance" component={StudentAttendancePage} roles={['student']} />
        <ProtectedRoute path="/student/academic" component={StudentAcademicPage} roles={['student']} />
        <ProtectedRoute path="/student/queries" component={StudentQueriesPage} roles={['student']} />
        <ProtectedRoute path="/student/queries/:id" component={StudentQueriesPage} roles={['student']} />
        
        {/* Proctor Routes */}
        <ProtectedRoute path="/proctor" component={ProctorDashboardPage} roles={['proctor']} />
        <ProtectedRoute path="/proctor/students" component={ProctorStudentsPage} roles={['proctor']} />
        <ProtectedRoute path="/proctor/student/:id" component={StudentDetailsPage} roles={['proctor']} />
        <ProtectedRoute path="/proctor/attendance" component={ProctorAttendancePage} roles={['proctor']} />
        <ProtectedRoute path="/proctor/queries" component={ProctorQueriesPage} roles={['proctor']} />
        <ProtectedRoute path="/proctor/reports" component={ProctorReportsPage} roles={['proctor']} />
        
        {/* Root redirects to auth page */}
        <Route path="/">
          {() => {
            window.location.href = "/auth";
            return null;
          }}
        </Route>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
