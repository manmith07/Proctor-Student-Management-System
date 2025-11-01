import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

const StudentAttendancePage = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  
  const { 
    data, 
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/student/attendance"],
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
            Error loading attendance data
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      </StudentLayout>
    );
  }

  const courseWise = data?.courseWise || {};
  const overall = data?.overall || { total: 0, present: 0, percentage: 0 };
  const courses = Object.keys(courseWise);
  const records = data?.records || [];
  
  // Filter records based on selected course
  const filteredRecords = selectedCourse === "all" 
    ? records 
    : records.filter(record => record.courseName === selectedCourse);

  return (
    <>
      <Helmet>
        <title>Attendance Records | ProctorDiary</title>
        <meta name="description" content="View and track your course-wise attendance records in the ProctorDiary system." />
      </Helmet>
      
      <StudentLayout>
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-semibold text-gray-500">Attendance Records</h2>
            <p className="mt-1 text-sm text-gray-400">Track your attendance across all courses</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="col-span-full md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-500">Overall Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <path
                        className="stroke-current text-gray-200"
                        fill="none"
                        strokeWidth="3"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`stroke-current ${
                          overall.percentage >= 75
                            ? "text-green-500"
                            : overall.percentage >= 60
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                        fill="none"
                        strokeWidth="3"
                        strokeDasharray={`${overall.percentage}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-500">{overall.percentage}%</span>
                      <span className="text-sm text-gray-400">
                        {overall.present} / {overall.total} classes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {courses.map(course => (
                    <div key={course} className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">{course}</span>
                      <span className={`text-sm font-medium ${
                        courseWise[course].percentage >= 75 
                          ? 'text-green-600' 
                          : courseWise[course].percentage >= 60 
                            ? 'text-amber-600' 
                            : 'text-red-600'
                      }`}>
                        {courseWise[course].percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-full md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium text-gray-500">Attendance Details</CardTitle>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course} value={course}>{course}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.map(record => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {format(new Date(record.date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>{record.courseName}</TableCell>
                            <TableCell>
                              <Badge variant={record.isPresent ? "success" : "destructive"}>
                                {record.isPresent ? "Present" : "Absent"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No attendance records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </StudentLayout>
    </>
  );
};

export default StudentAttendancePage;
