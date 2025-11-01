import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ProctorLayout from "@/components/layout/proctor-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { AvatarWithOnlineStatus } from "@/components/ui/avatar-with-online-status";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Calendar
} from "lucide-react";

// Student risk levels
const RISK_LEVELS = {
  HIGH: { label: "High Risk", color: "destructive", icon: AlertTriangle },
  MEDIUM: { label: "Medium Risk", color: "secondary", icon: AlertTriangle },
  LOW: { label: "Good Standing", color: "default", icon: CheckCircle },
} as const;

// Calculate risk level based on attendance and CGPA
const calculateRiskLevel = (attendance: number, cgpa: number) => {
  if (attendance < 65 || cgpa < 5.0) return RISK_LEVELS.HIGH;
  if (attendance < 75 || cgpa < 6.5) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
};

interface Student {
  id: number;
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

const ProctorStudentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [, setLocation] = useLocation();
  const studentsPerPage = 10;
  
  const { 
    data, 
    isLoading,
    error
  } = useQuery<StudentsResponse>({
    queryKey: ["/api/proctor/students"],
  });

  if (isLoading) {
    return (
      <ProctorLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      </ProctorLayout>
    );
  }

  if (error) {
    return (
      <ProctorLayout>
        <div className="px-4 py-6 text-center">
          <h3 className="text-lg font-medium text-gray-500">
            Error loading students data
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      </ProctorLayout>
    );
  }

  const students = data?.students || [];

  // Filter students based on tab and search
  const filteredStudents = students.filter((student) => {
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const matchesSearch = searchTerms.every((term) => {
      return (
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.studentId.toLowerCase().includes(term) ||
        student.department.toLowerCase().includes(term)
      );
    });
    
    // Risk level filtering
    const riskLevel = calculateRiskLevel(student.attendance.percentage, student.cgpa);
    if (activeTab === "high-risk" && riskLevel !== RISK_LEVELS.HIGH) return false;
    if (activeTab === "medium-risk" && riskLevel !== RISK_LEVELS.MEDIUM) return false;
    if (activeTab === "good-standing" && riskLevel !== RISK_LEVELS.LOW) return false;
    
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  // Stats
  const totalCount = students.length;
  const highRiskCount = students.filter(s => 
    calculateRiskLevel(s.attendance.percentage, s.cgpa) === RISK_LEVELS.HIGH
  ).length;
  const mediumRiskCount = students.filter(s => 
    calculateRiskLevel(s.attendance.percentage, s.cgpa) === RISK_LEVELS.MEDIUM
  ).length;
  const goodStandingCount = students.filter(s => 
    calculateRiskLevel(s.attendance.percentage, s.cgpa) === RISK_LEVELS.LOW
  ).length;

  return (
    <>
      <Helmet>
        <title>Manage Students | ProctorDiary</title>
        <meta name="description" content="View and manage your assigned students in the ProctorDiary system." />
      </Helmet>
      
      <ProctorLayout>
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-semibold text-gray-500">Students Management</h2>
            <p className="mt-1 text-sm text-gray-400">Manage and monitor your assigned students</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className={`bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200`}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="mr-4 p-3 bg-blue-500 text-white rounded-full">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Students</p>
                    <p className="text-2xl font-semibold text-gray-600">{totalCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={`bg-gradient-to-br from-green-50 to-green-100 border-green-200`}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="mr-4 p-3 bg-green-500 text-white rounded-full">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Good Standing</p>
                    <p className="text-2xl font-semibold text-gray-600">{goodStandingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={`bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200`}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="mr-4 p-3 bg-amber-500 text-white rounded-full">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Medium Risk</p>
                    <p className="text-2xl font-semibold text-gray-600">{mediumRiskCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={`bg-gradient-to-br from-red-50 to-red-100 border-red-200`}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="mr-4 p-3 bg-red-500 text-white rounded-full">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">High Risk</p>
                    <p className="text-2xl font-semibold text-gray-600">{highRiskCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-between items-start sm:items-center pb-2">
              <CardTitle className="text-lg font-medium text-gray-500">Student List</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search students..."
                  className="pl-9 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
              </div>
            </CardHeader>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="px-6">
              <TabsList className="grid grid-cols-4 w-full sm:w-[400px]">
                <TabsTrigger value="all">All Students</TabsTrigger>
                <TabsTrigger value="high-risk">High Risk</TabsTrigger>
                <TabsTrigger value="medium-risk">Medium Risk</TabsTrigger>
                <TabsTrigger value="good-standing">Good Standing</TabsTrigger>
              </TabsList>
            </Tabs>

            <CardContent className="pt-4">
              {currentStudents.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>CGPA</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentStudents.map((student) => {
                          const riskLevel = calculateRiskLevel(student.attendance.percentage, student.cgpa);
                          const RiskIcon = riskLevel.icon;
                          
                          return (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <AvatarWithOnlineStatus
                                    src={`https://images.unsplash.com/photo-${student.id % 2 === 0 ? '1553877522-43269d4ea984' : '1558021212-51b6ecfa0db9'}?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80`}
                                    fallback={student.name.charAt(0).toUpperCase()}
                                    alt={student.name}
                                    size="sm"
                                  />
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-500">{student.name}</div>
                                    <div className="text-sm text-gray-400">{student.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-400">{student.studentId}</TableCell>
                              <TableCell className="text-sm text-gray-400">{student.department}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className={`text-sm mr-2 ${
                                    student.attendance.percentage >= 75 
                                      ? 'text-green-600' 
                                      : student.attendance.percentage >= 60 
                                        ? 'text-amber-600' 
                                        : 'text-red-600'
                                  }`}>
                                    {student.attendance.percentage}%
                                  </span>
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        student.attendance.percentage >= 75 
                                          ? 'bg-green-500' 
                                          : student.attendance.percentage >= 60 
                                            ? 'bg-amber-500' 
                                            : 'bg-red-500'
                                      }`}
                                      style={{ width: `${student.attendance.percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className={`text-sm font-medium ${
                                student.cgpa >= 7.5 
                                  ? 'text-green-600' 
                                  : student.cgpa >= 6.0 
                                    ? 'text-amber-600' 
                                    : 'text-red-600'
                              }`}>
                                {student.cgpa.toFixed(1)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={riskLevel.color}>
                                  <RiskIcon className="h-3 w-3 mr-1" />
                                  {riskLevel.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-secondary"
                                  onClick={() => setLocation(`/proctor/student/${student.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-secondary"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Message
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm text-gray-400">
                      Showing {indexOfFirstStudent + 1}-{Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} students
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">
                    {searchQuery ? "No students match your search criteria" : "No students assigned yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ProctorLayout>
    </>
  );
};

export default ProctorStudentsPage;
