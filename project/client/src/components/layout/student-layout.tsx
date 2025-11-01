import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AvatarWithOnlineStatus } from "@/components/ui/avatar-with-online-status";
import { LogOut, GraduationCap, BarChart3, Calendar, MessagesSquare } from "lucide-react";

type StudentLayoutProps = {
  children: React.ReactNode;
};

const StudentLayout = ({ children }: StudentLayoutProps) => {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navLinks = [
    { href: "/student", label: "Dashboard", icon: <GraduationCap className="h-4 w-4 mr-2" /> },
    { href: "/student/academic", label: "Academic Records", icon: <BarChart3 className="h-4 w-4 mr-2" /> },
    { href: "/student/attendance", label: "Attendance", icon: <Calendar className="h-4 w-4 mr-2" /> },
    { href: "/student/queries", label: "Queries", icon: <MessagesSquare className="h-4 w-4 mr-2" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <h1 className="text-primary font-heading font-bold text-xl">ProctorDiary</h1>
            </div>
            
            {/* Navigation - Desktop */}
            <nav className="hidden md:flex space-x-8 items-center">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`flex items-center px-1 pt-1 text-sm font-medium ${
                    location === link.href || 
                    (link.href !== "/student" && location.startsWith(link.href))
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-400 hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            {/* Profile and Logout */}
            <div className="flex items-center">
              <div className="ml-3 relative flex items-center">
                <AvatarWithOnlineStatus
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
                  fallback={user?.name?.charAt(0) || "U"}
                  status="online"
                  size="sm"
                />
                <span className="ml-2 text-sm font-medium text-gray-500">{user?.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="ml-4 text-gray-400 hover:text-gray-500"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="grid grid-cols-4">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`flex flex-col items-center py-3 ${
                location === link.href || 
                (link.href !== "/student" && location.startsWith(link.href))
                  ? "text-primary"
                  : "text-gray-400"
              }`}
            >
              {link.icon}
              <span className="text-xs">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;
