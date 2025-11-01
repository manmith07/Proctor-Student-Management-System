import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import ProctorLayout from "@/components/layout/proctor-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Chart colors
const ATTENDANCE_COLORS = {
  'Above 85%': '#4caf50',  // Green for excellent
  '75-85%': '#2196f3',    // Blue for good
  '60-75%': '#ff9800',    // Orange for average
  'Below 60%': '#f44336'  // Red for poor
} as const;

type AttendanceRange = keyof typeof ATTENDANCE_COLORS;

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  name: AttendanceRange;
  value: number;
  percent: number;
}

const CUSTOM_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, value }: CustomLabelProps) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.4; // Increase radius to push labels further out
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Adjust text anchor based on which side of the pie the label is on
  const textAnchor = x > cx ? 'start' : 'end';
  
  // Format the percentage and value
  const formattedPercent = (percent * 100).toFixed(0);
  
  return (
    <g>
      {/* Draw a line from pie to label */}
      <path
        d={`M ${cx + (outerRadius + 10) * Math.cos(-midAngle * RADIAN)},${
          cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN)
        }L ${x},${y}`}
        stroke="#666"
        strokeWidth={1}
        fill="none"
      />
      {/* Add label with background */}
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fill="#333"
        dominantBaseline="central"
        fontSize="12"
        fontWeight="500"
      >
        {`${name} (${value})`}
      </text>
    </g>
  );
};

interface Student {
  id: number;
  name: string;
  attendance: {
    percentage: number;
    total: number;
    present: number;
  };
}

interface StudentsResponse {
  students: Student[];
}

const ProctorAttendancePage = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  const { 
    data: studentsData, 
    isLoading: studentsLoading
  } = useQuery<StudentsResponse>({
    queryKey: ["/api/proctor/students"],
  });

  if (studentsLoading) {
    return (
      <ProctorLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      </ProctorLayout>
    );
  }

  const students = studentsData?.students || [];

  // Calculate attendance statistics
  const calculateAttendanceRanges = () => {
    const ranges = {
      'Below 60%': 0,
      '60-75%': 0,
      '75-85%': 0,
      'Above 85%': 0,
    } satisfies Record<AttendanceRange, number>;

    students.forEach((student) => {
      const percentage = student.attendance.percentage;
      if (percentage < 60) ranges['Below 60%']++;
      else if (percentage < 75) ranges['60-75%']++;
      else if (percentage < 85) ranges['75-85%']++;
      else ranges['Above 85%']++;
    });

    return Object.entries(ranges).map(([name, value]) => ({ 
      name: name as AttendanceRange, 
      value 
    }));
  };

  // Prepare data for charts
  const attendanceRangeData = calculateAttendanceRanges();
  
  const studentAttendanceData = students.map((student: any) => ({
    name: student.name,
    attendance: student.attendance.percentage,
    fill: student.attendance.percentage >= 75 
      ? '#4caf50' 
      : student.attendance.percentage >= 60 
        ? '#ff9800' 
        : '#f44336'
  })).sort((a: any, b: any) => a.attendance - b.attendance);

  // Calculate course-wise attendance data (simplified example)
  // In a real app, this would come from more detailed attendance records
  const courseAttendanceData = [
    { name: 'Data Structures', averageAttendance: 82 },
    { name: 'Computer Networks', averageAttendance: 78 },
    { name: 'Database Systems', averageAttendance: 75 },
    { name: 'Operating Systems', averageAttendance: 68 },
    { name: 'Web Development', averageAttendance: 88 },
  ];

  // Weekly attendance trend (simplified example)
  // In a real app, this would come from actual weekly attendance records
  const weeklyTrendData = [
    { week: 'Week 1', attendance: 92 },
    { week: 'Week 2', attendance: 88 },
    { week: 'Week 3', attendance: 85 },
    { week: 'Week 4', attendance: 82 },
    { week: 'Week 5', attendance: 79 },
    { week: 'Week 6', attendance: 83 },
    { week: 'Week 7', attendance: 80 },
    { week: 'Week 8', attendance: 78 },
  ];

  // Calculate overall average attendance
  const overallAttendance = students.length > 0
    ? students.reduce((sum: number, student: any) => sum + student.attendance.percentage, 0) / students.length
    : 0;

  return (
    <>
      <Helmet>
        <title>Attendance Monitoring | ProctorDiary</title>
        <meta name="description" content="Monitor and analyze student attendance patterns in the ProctorDiary system." />
      </Helmet>
      
      <ProctorLayout>
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-semibold text-gray-500">Attendance Monitoring</h2>
            <p className="mt-1 text-sm text-gray-400">Track and analyze student attendance patterns</p>
          </div>

          <div className="mb-6 flex justify-between items-center">
            <div className="flex space-x-4">
              <button 
                className={`px-4 py-2 font-medium rounded-md ${activeTab === 'overview' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`px-4 py-2 font-medium rounded-md ${activeTab === 'details' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => setActiveTab('details')}
              >
                Student Details
              </button>
              <button 
                className={`px-4 py-2 font-medium rounded-md ${activeTab === 'courses' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => setActiveTab('courses')}
              >
                Course-wise
              </button>
              <button 
                className={`px-4 py-2 font-medium rounded-md ${activeTab === 'trends' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => setActiveTab('trends')}
              >
                Trends
              </button>
            </div>

            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.map((student: any) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-gray-500">Average Attendance</CardTitle>
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
                              overallAttendance >= 75
                                ? "text-green-500"
                                : overallAttendance >= 60
                                ? "text-amber-500"
                                : "text-red-500"
                            }`}
                            fill="none"
                            strokeWidth="3"
                            strokeDasharray={`${overallAttendance}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-gray-500">{overallAttendance.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-gray-500">Attendance Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 20, right: 120, bottom: 20, left: 120 }}>
                          <Pie
                            data={attendanceRangeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            fill="#8884d8"
                            dataKey="value"
                            label={CUSTOM_LABEL}
                            startAngle={90}
                            endAngle={-270}
                          >
                            {attendanceRangeData.map((entry) => (
                              <Cell 
                                key={`cell-${entry.name}`} 
                                fill={ATTENDANCE_COLORS[entry.name]}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} students`, name]}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              padding: '8px'
                            }}
                          />
                          <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-500">Student Attendance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={studentAttendanceData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={90}
                          tick={{ fontSize: 12 }} 
                        />
                        <Tooltip />
                        <Bar dataKey="attendance" name="Attendance %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "details" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-500">
                  {selectedStudent === "all" ? "All Students" : 
                    students.find((s: any) => s.id.toString() === selectedStudent)?.name || "Student"} Attendance Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Present</TableHead>
                        <TableHead>Absent</TableHead>
                        <TableHead>Total Classes</TableHead>
                        <TableHead>Attendance %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedStudent === "all" ? students : 
                        students.filter((s: any) => s.id.toString() === selectedStudent)).map((student: any) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell>{student.department}</TableCell>
                          <TableCell>{student.semester}</TableCell>
                          <TableCell>{student.attendance.present}</TableCell>
                          <TableCell>{student.attendance.total - student.attendance.present}</TableCell>
                          <TableCell>{student.attendance.total}</TableCell>
                          <TableCell className={`font-medium ${
                            student.attendance.percentage >= 75 
                              ? 'text-green-600' 
                              : student.attendance.percentage >= 60 
                                ? 'text-amber-600' 
                                : 'text-red-600'
                          }`}>
                            {student.attendance.percentage}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "courses" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-500">Course-wise Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={courseAttendanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="averageAttendance" 
                        name="Average Attendance %" 
                        fill="#1976d2"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "trends" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-500">Weekly Attendance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyTrendData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="attendance" 
                        name="Average Attendance %" 
                        fill="#388e3c"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ProctorLayout>
    </>
  );
};

export default ProctorAttendancePage;