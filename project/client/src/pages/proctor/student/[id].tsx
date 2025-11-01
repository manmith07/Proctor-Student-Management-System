import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Helmet } from "react-helmet";
import ProctorLayout from "@/components/layout/proctor-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface StudentDetailsResponse {
  student: {
    id: number;
    userId: number;
    name: string;
    email: string;
    studentId: string;
    department: string;
    semester: number;
    cgpa: number;
  };
  attendance: Array<{
    id: number;
    date: string;
    courseName: string;
    isPresent: boolean;
  }>;
  academics: Array<{
    id: number;
    courseName: string;
    semester: number;
    internalMarks: number;
    quizMarks: number;
    projectMarks: number;
    semesterMarks: number;
    totalMarks: number;
  }>;
}

const StudentDetailsPage = () => {
  const params = useParams();
  const studentId = params.id;

  const { 
    data, 
    isLoading,
    error
  } = useQuery<StudentDetailsResponse>({
    queryKey: [`/api/proctor/student/${studentId}`],
    enabled: !!studentId,
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

  if (error || !data) {
    return (
      <ProctorLayout>
        <div className="px-4 py-6 text-center">
          <h3 className="text-lg font-medium text-gray-500">
            Error loading student details
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      </ProctorLayout>
    );
  }

  const { student, attendance, academics } = data;

  // Calculate attendance statistics
  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(record => record.isPresent).length;
  const attendancePercentage = totalClasses > 0 
    ? Number(((presentClasses / totalClasses) * 100).toFixed(2)) 
    : 0;

  // Calculate academic statistics
  const courseWisePerformance = academics.reduce((acc, record) => {
    if (!acc[record.courseName]) {
      acc[record.courseName] = {
        internal: record.internalMarks,
        quiz: record.quizMarks,
        project: record.projectMarks,
        semester: record.semesterMarks,
        total: record.totalMarks
      };
    }
    return acc;
  }, {} as Record<string, any>);

  return (
    <>
      <Helmet>
        <title>{student.name} | Student Details | ProctorDiary</title>
        <meta name="description" content="View detailed student information in the ProctorDiary system." />
      </Helmet>
      
      <ProctorLayout>
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-heading font-semibold text-gray-500">{student.name}</h2>
                <p className="mt-1 text-sm text-gray-400">{student.email}</p>
              </div>
              <Button variant="outline" className="text-secondary">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Student Info</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-400">Student ID</dt>
                    <dd className="text-sm font-medium text-gray-500">{student.studentId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">Department</dt>
                    <dd className="text-sm font-medium text-gray-500">{student.department}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">Semester</dt>
                    <dd className="text-sm font-medium text-gray-500">{student.semester}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-400">CGPA</dt>
                    <dd className="text-sm font-medium text-gray-500">{student.cgpa}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <path
                        className="stroke-current text-gray-200"
                        fill="none"
                        strokeWidth="3"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`stroke-current ${
                          attendancePercentage >= 75
                            ? "text-green-500"
                            : attendancePercentage >= 60
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                        fill="none"
                        strokeWidth="3"
                        strokeDasharray={`${attendancePercentage}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-500">{attendancePercentage}%</span>
                      <span className="text-sm text-gray-400">
                        {presentClasses} / {totalClasses} classes
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Academic Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(courseWisePerformance).map(([course, marks]) => (
                    <div key={course}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">{course}</span>
                        <span className="text-sm font-medium text-gray-500">{marks.total}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            marks.total >= 75
                              ? "bg-green-500"
                              : marks.total >= 60
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${marks.total}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="attendance" className="space-y-6">
            <TabsList>
              <TabsTrigger value="attendance">Attendance Details</TabsTrigger>
              <TabsTrigger value="academics">Academic Records</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-500">Attendance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendance.map(record => (
                      <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{record.courseName}</p>
                          <p className="text-xs text-gray-400">{format(new Date(record.date), 'MMMM dd, yyyy')}</p>
                        </div>
                        <Badge variant={record.isPresent ? "default" : "destructive"}>
                          {record.isPresent ? "Present" : "Absent"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academics">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-500">Academic Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {academics.map(record => (
                      <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">{record.courseName}</h4>
                            <p className="text-xs text-gray-400">Semester {record.semester}</p>
                          </div>
                          <Badge variant={record.totalMarks >= 75 ? "default" : record.totalMarks >= 60 ? "secondary" : "destructive"}>
                            {record.totalMarks}%
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">Internal Assessment</span>
                              <span className="text-gray-500">{record.internalMarks}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${record.internalMarks}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">Quiz</span>
                              <span className="text-gray-500">{record.quizMarks}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div className="bg-green-500 h-1 rounded-full" style={{ width: `${record.quizMarks}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">Project</span>
                              <span className="text-gray-500">{record.projectMarks}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${record.projectMarks}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">Semester Exam</span>
                              <span className="text-gray-500">{record.semesterMarks}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div className="bg-amber-500 h-1 rounded-full" style={{ width: `${record.semesterMarks}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ProctorLayout>
    </>
  );
};

export default StudentDetailsPage; 