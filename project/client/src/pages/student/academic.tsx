import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Award } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AcademicRecord {
  id: number;
  studentId: number;
  courseId: string;
  courseName: string;
  semester: number;
  internalMarks: number | null;
  quizMarks: number | null;
  projectMarks: number | null;
  semesterMarks: number | null;
  totalMarks: number | null;
}

interface AcademicResponse {
  cgpa: number;
  records: AcademicRecord[];
}

interface CourseData {
  name: string;
  internal: number;
  quiz: number;
  project: number;
  semester: number;
  total: number;
}

interface SemesterData {
  semester: number;
  courses: CourseData[];
}

interface PerformanceData {
  course: string;
  internal: number;
  quiz: number;
  project: number;
  semester: number;
}

const StudentAcademicPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { 
    data, 
    isLoading,
    error
  } = useQuery<AcademicResponse>({
    queryKey: ["/api/student/academic"],
  });

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="px-4 py-6 text-center">
          <h3 className="text-lg font-medium text-gray-500">
            Error loading academic data
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      </StudentLayout>
    );
  }

  const cgpa = data?.cgpa || 0;
  const records = data?.records || [];

  // Group records by semester for the progression chart
  const semesterWiseData = records.reduce<SemesterData[]>((acc, record) => {
    const existingSemester = acc.find(item => item.semester === record.semester);
    
    if (existingSemester) {
      existingSemester.courses.push({
        name: record.courseName,
        internal: record.internalMarks || 0,
        quiz: record.quizMarks || 0,
        project: record.projectMarks || 0,
        semester: record.semesterMarks || 0,
        total: record.totalMarks || 0,
      });
    } else {
      acc.push({
        semester: record.semester,
        courses: [{
          name: record.courseName,
          internal: record.internalMarks || 0,
          quiz: record.quizMarks || 0,
          project: record.projectMarks || 0,
          semester: record.semesterMarks || 0,
          total: record.totalMarks || 0,
        }]
      });
    }
    
    return acc;
  }, []).sort((a, b) => a.semester - b.semester);

  // Create data for the CGPA progression chart
  const cgpaProgressionData = [
    { semester: 1, cgpa: 8.4 },
    { semester: 2, cgpa: 8.3 },
    { semester: 3, cgpa: 8.5 },
    { semester: 4, cgpa },
  ];

  // Current semester courses for the performance breakdown
  const currentSemesterCourses = semesterWiseData.length > 0 
    ? semesterWiseData[semesterWiseData.length - 1].courses
    : [];

  // Transform data for the radar chart
  const performanceData: PerformanceData[] = currentSemesterCourses.map(course => ({
    course: course.name,
    internal: course.internal,
    quiz: course.quiz,
    project: course.project,
    semester: course.semester,
  }));

  return (
    <>
      <Helmet>
        <title>Academic Records | ProctorDiary</title>
        <meta name="description" content="View your academic performance, course grades, and progress reports in the ProctorDiary system." />
      </Helmet>
      
      <StudentLayout>
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-semibold text-gray-500">Academic Records</h2>
            <p className="mt-1 text-sm text-gray-400">Track your academic performance and results</p>
          </div>

          <Tabs 
            defaultValue="overview" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium text-gray-500">CGPA</CardTitle>
                    <Award className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-5xl font-bold text-primary mb-2">{cgpa.toFixed(1)}</p>
                      <p className="text-sm text-gray-400">Current CGPA</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-500">CGPA Progression</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cgpaProgressionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semester" label={{ value: 'Semester', position: 'insideBottom', offset: -5 }} />
                          <YAxis domain={[0, 10]} label={{ value: 'CGPA', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="cgpa" stroke="#1976d2" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium text-gray-500">Component-wise Performance</CardTitle>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Internal Marks */}
                      <div className="h-[250px]">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Internal Assessment (50)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="course" angle={-45} textAnchor="end" height={60} />
                            <YAxis domain={[0, 50]} />
                            <Tooltip />
                            <Bar 
                              dataKey="internal" 
                              name="Internal" 
                              fill="#1976d2"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Quiz Marks */}
                      <div className="h-[250px]">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Quiz Performance (10)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="course" angle={-45} textAnchor="end" height={60} />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Bar 
                              dataKey="quiz" 
                              name="Quiz" 
                              fill="#388e3c"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Project Marks */}
                      <div className="h-[250px]">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Project Assessment (10)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="course" angle={-45} textAnchor="end" height={60} />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Bar 
                              dataKey="project" 
                              name="Project" 
                              fill="#f57c00"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Semester Marks */}
                      <div className="h-[250px]">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Semester Exam (100)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="course" angle={-45} textAnchor="end" height={60} />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar 
                              dataKey="semester" 
                              name="Semester" 
                              fill="#e91e63"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="courses" className="mt-6">
              <div className="grid grid-cols-1 gap-6">
                {semesterWiseData.map((semester: SemesterData, index: number) => (
                  <Card key={`semester-${semester.semester}`}>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-gray-500">
                        Semester {semester.semester}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="py-2 px-4 text-left font-semibold text-gray-400">Course</th>
                              <th className="py-2 px-4 text-left font-semibold text-gray-400">Internal (50)</th>
                              <th className="py-2 px-4 text-left font-semibold text-gray-400">Quiz (10)</th>
                              <th className="py-2 px-4 text-left font-semibold text-gray-400">Project (10)</th>
                              <th className="py-2 px-4 text-left font-semibold text-gray-400">Semester (100)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semester.courses.map((course: CourseData, courseIndex: number) => (
                              <tr key={`course-${courseIndex}`} className="border-b">
                                <td className="py-2 px-4 font-medium text-gray-500">{course.name}</td>
                                <td className="py-2 px-4 text-gray-400">{course.internal || "NA"}</td>
                                <td className="py-2 px-4 text-gray-400">{course.quiz || "NA"}</td>
                                <td className="py-2 px-4 text-gray-400">{course.project || "NA"}</td>
                                <td className="py-2 px-4 text-gray-400">{course.semester || "NA"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {semesterWiseData.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No academic records found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </StudentLayout>
    </>
  );
};

export default StudentAcademicPage;
