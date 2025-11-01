import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { AvatarWithOnlineStatus } from "@/components/ui/avatar-with-online-status";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  Search, 
  Loader2 
} from "lucide-react";

type Student = {
  id: number;
  userId: number;
  name: string;
  email: string;
  studentId: string;
  department: string;
  semester: number;
  cgpa: number;
  attendance: {
    percentage: number;
    total: number;
    present: number;
  };
};

type StudentListTableProps = {
  students: Student[];
  loading?: boolean;
  className?: string;
};

export const StudentListTable = ({ students = [], loading = false, className = "" }: StudentListTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;
  const [, setLocation] = useLocation();

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    const searchTerms = searchQuery.toLowerCase().split(" ");
    
    // Check if all search terms match any of the student properties
    return searchTerms.every((term) => {
      return (
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.studentId.toLowerCase().includes(term) ||
        student.department.toLowerCase().includes(term)
      );
    });
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  return (
    <Card className={className}>
      <CardHeader className="border-b border-gray-200 flex-row justify-between items-center px-6 py-5">
        <CardTitle className="text-lg font-medium text-gray-500">Assigned Students</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search students..."
            className="pl-9 text-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="px-6 py-5">
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : currentStudents.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>CGPA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentStudents.map((student) => (
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
                      <TableCell className="text-sm text-gray-400">{student.cgpa.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          className="text-secondary hover:text-secondary/80 mr-2"
                          onClick={() => setLocation(`/proctor/student/${student.studentId}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-secondary hover:text-secondary/80"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                  <ChevronLeft className="h-4 w-4" />
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
  );
};
