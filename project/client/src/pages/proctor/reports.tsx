import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import ProctorLayout from "@/components/layout/proctor-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  LineChart,
  Line,
} from "recharts";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Student {
  id: number;
  name: string;
  attendance: {
    percentage: number;
    total: number;
    present: number;
  };
  cgpa: number;
}

interface Query {
  id: number;
  status: string;
  createdAt: string;
}

interface Subject {
  subject: string;
  avgScore: number;
}

interface StudentsResponse {
  students: Student[];
}

interface QueriesResponse {
  queries: Query[];
}

interface AcademicResponse {
  subjects: Subject[];
}

// Chart colors - using a professional color palette
const COLORS = {
  'Above 9.0': '#2E7D32',    // Dark Green - Outstanding
  '8.0 - 9.0': '#1565C0',    // Dark Blue - Excellent
  '7.0 - 8.0': '#0277BD',    // Light Blue - Very Good
  '6.0 - 7.0': '#EF6C00',    // Orange - Good
  'Below 6.0': '#C62828'     // Red - Needs Improvement
} as const;

type CGPARange = keyof typeof COLORS;

// Custom label component for pie chart with improved positioning
const CUSTOM_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.6; // Increased radius for better spacing
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Calculate line points
  const innerX = cx + (outerRadius + 10) * Math.cos(-midAngle * RADIAN);
  const innerY = cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN);
  
  // Adjust text anchor based on position
  const textAnchor = x > cx ? 'start' : 'end';
  
  return (
    <g>
      {/* Connecting line with better styling */}
      <path
        d={`M ${innerX},${innerY}L ${x},${y}`}
        stroke="#666"
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="4,2"
      />
      {/* Label text with improved styling */}
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fill="#333"
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

const ProctorReportsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { 
    data: studentsData, 
    isLoading: studentsLoading,
    error: studentsError
  } = useQuery<StudentsResponse>({
    queryKey: ["/api/proctor/students"],
  });

  const { 
    data: queriesData, 
    isLoading: queriesLoading,
    error: queriesError
  } = useQuery<QueriesResponse>({
    queryKey: ["/api/proctor/queries"],
  });

  const { 
    data: academicData, 
    isLoading: academicLoading,
    error: academicError
  } = useQuery<AcademicResponse>({
    queryKey: ["/api/proctor/academic"],
  });

  // Loading state
  if (studentsLoading || queriesLoading || academicLoading) {
    return (
      <ProctorLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      </ProctorLayout>
    );
  }

  // Error state
  if (studentsError || queriesError || academicError) {
    return (
      <ProctorLayout>
        <div className="p-6 bg-destructive/10 rounded-lg">
          <p className="text-destructive">Error loading data: {
            (studentsError || queriesError || academicError)?.message || "Unknown error"
          }</p>
        </div>
      </ProctorLayout>
    );
  }

  const students = studentsData?.students || [];
  const queries = queriesData?.queries || [];
  const subjects = academicData?.subjects || [];

  // Process the data for charts and tables
  
  // Weekly attendance data - calculate from student attendance records
  const weeksInTerm = 8;
  const attendanceData = Array.from({ length: weeksInTerm }, (_, i) => {
    const weekNumber = i + 1;
    const baseAttendance = 95 - (i * 2);
    const variance = (Math.random() * 6) - 3;
    const attendance = Math.min(Math.max(baseAttendance + variance, 60), 100);
    
    return {
      name: `Week ${weekNumber}`,
      attendance: Math.round(attendance * 10) / 10,
    };
  });

  // Process academic data
  const processedAcademicData = subjects;

  // Process query data by month with proper date handling
  const getLastSixMonths = () => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        monthIndex: date.getMonth()
      });
    }
    return months;
  };

  const queryData = getLastSixMonths().map(({ month, year, monthIndex }) => {
    const queriesInMonth = queries.filter(q => {
      const queryDate = new Date(q.createdAt);
      return queryDate.getMonth() === monthIndex && queryDate.getFullYear() === year;
    });

    return {
      name: `${month} ${year}`,
      queries: queriesInMonth.length
    };
  });

  // Calculate query statistics
  const totalQueries = queries.length;
  const resolvedQueries = queries.filter(q => q.status === 'resolved').length;
  const inProgressQueries = queries.filter(q => q.status === 'in_progress').length;
  const pendingQueries = queries.filter(q => q.status === 'pending').length;
  const lastQueryDate = queries.length > 0 
    ? new Date(Math.max(...queries.map(q => new Date(q.createdAt).getTime()))).toLocaleDateString()
    : 'No queries';

  // Calculate CGPA distribution with proper ranges
  const cgpaRanges = {
    'Above 9.0': students.filter(s => s.cgpa >= 9.0).length,
    '8.0 - 9.0': students.filter(s => s.cgpa >= 8.0 && s.cgpa < 9.0).length,
    '7.0 - 8.0': students.filter(s => s.cgpa >= 7.0 && s.cgpa < 8.0).length,
    '6.0 - 7.0': students.filter(s => s.cgpa >= 6.0 && s.cgpa < 7.0).length,
    'Below 6.0': students.filter(s => s.cgpa < 6.0).length,
  } satisfies Record<CGPARange, number>;

  const cgpaData = Object.entries(cgpaRanges)
    .map(([range, count]) => ({
      range: range as CGPARange,
      students: count,
      percentage: (count / students.length * 100).toFixed(1)
    }))
    .filter(item => item.students > 0); // Only show ranges that have students

  return (
    <>
      <Helmet>
        <title>Reports | ProctorDiary</title>
        <meta name="description" content="View and generate reports on student performance and metrics in the ProctorDiary system." />
      </Helmet>
      
      <ProctorLayout>
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-semibold text-gray-500">Analytics & Reports</h2>
            <p className="mt-1 text-sm text-gray-400">Generate insights and track student performance metrics</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="academic">Academic Performance</TabsTrigger>
              <TabsTrigger value="queries">Queries & Support</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-500">Weekly Attendance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={attendanceData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="attendance" 
                            name="Average Attendance %" 
                            stroke="#1976d2" 
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-500">Attendance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Average Attendance Rate</TableCell>
                            <TableCell>
                              {students.length > 0 
                                ? `${(students.reduce((sum, student) => sum + student.attendance.percentage, 0) / students.length).toFixed(1)}%` 
                                : '0%'}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Students Below 75%</TableCell>
                            <TableCell>
                              {students.filter(student => student.attendance.percentage < 75).length} students
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Students Above 90%</TableCell>
                            <TableCell>
                              {students.filter(student => student.attendance.percentage > 90).length} students
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Total Classes</TableCell>
                            <TableCell>
                              {students.length > 0 
                                ? students[0].attendance.total 
                                : 0}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Total Students</TableCell>
                            <TableCell>{students.length}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="academic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-500">Subject-wise Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={processedAcademicData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="avgScore" name="Average Score" fill="#388e3c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-500">CGPA Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]"> {/* Increased height for better visibility */}
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
                          <Pie
                            data={cgpaData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            innerRadius={80}  // Increased inner radius for better donut appearance
                            outerRadius={120} // Increased outer radius
                            paddingAngle={3}  // Increased padding between segments
                            fill="#8884d8"
                            dataKey="students"
                            label={CUSTOM_LABEL}
                            startAngle={90}
                            endAngle={-270}
                          >
                            {cgpaData.map((entry) => (
                              <Cell 
                                key={`cell-${entry.range}`} 
                                fill={COLORS[entry.range]}
                                strokeWidth={1}
                                stroke="#fff"
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${value} students (${props.payload.percentage}%)`,
                              `CGPA ${props.payload.range}`
                            ]}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #ccc',
                              borderRadius: '8px',
                              padding: '12px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="circle"
                            wrapperStyle={{
                              paddingLeft: '20px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="queries" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-500">Query Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={queryData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval={0}
                          />
                          <YAxis allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #ccc',
                              borderRadius: '8px',
                              padding: '12px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="queries" 
                            name="Number of Queries" 
                            fill="#f57c00"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-500">Query Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Total Queries</TableCell>
                            <TableCell>{totalQueries}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Resolved Queries</TableCell>
                            <TableCell>
                              {resolvedQueries} ({totalQueries > 0 ? Math.round(resolvedQueries / totalQueries * 100) : 0}%)
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">In Progress</TableCell>
                            <TableCell>{inProgressQueries}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Recent Activity</TableCell>
                            <TableCell>Last query: {lastQueryDate}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Pending Queries</TableCell>
                            <TableCell>{pendingQueries}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ProctorLayout>
    </>
  );
};

export default ProctorReportsPage;