import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import StudentLayout from "@/components/layout/student-layout";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { 
  PlusIcon, 
  Loader2, 
  MessageSquare,
  Send,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";

// Form schemas
const queryFormSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const responseFormSchema = z.object({
  response: z.string().min(1, "Response cannot be empty"),
});

type QueryFormData = z.infer<typeof queryFormSchema>;
type ResponseFormData = z.infer<typeof responseFormSchema>;

interface ProfileResponse {
  profile: {
    id: number;
    userId: number;
    studentId: string;
    department: string;
    semester: number;
    cgpa: number;
    proctorId: number;
  };
  proctor: {
    id: number;
    name: string;
    email: string;
    department: string;
    designation: string;
    phone: string;
  } | null;
}

interface QueriesResponse {
  queries: Array<{
    id: number;
    subject: string;
    description: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    createdAt: string;
    studentId: number;
    proctorId: number;
  }>;
}

interface QueryDetailsResponse {
  query: {
    id: number;
    subject: string;
    description: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    createdAt: string;
    studentId: number;
    proctorId: number;
  };
  student: {
    id: number;
    name: string;
    email: string;
  } | null;
  proctor: {
    id: number;
    name: string;
    email: string;
  } | null;
  responses: Array<{
    id: number;
    queryId: number;
    userId: number;
    response: string;
    createdAt: string;
    user: {
      id: number;
      name: string;
      role: 'student' | 'proctor';
    };
  }>;
}

const StudentQueriesPage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedQuery, setSelectedQuery] = useState<number | null>(id ? parseInt(id) : null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [isNewQueryDialogOpen, setIsNewQueryDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set selected query when URL parameter changes
  useEffect(() => {
    if (id) {
      setSelectedQuery(parseInt(id));
    }
  }, [id]);

  // Fetch queries
  const { 
    data: queriesData, 
    isLoading: queriesLoading
  } = useQuery<QueriesResponse>({
    queryKey: ["/api/student/queries"],
  });

  // Fetch user profile to get proctor info
  const { 
    data: profileData, 
    isLoading: profileLoading
  } = useQuery<ProfileResponse>({
    queryKey: ["/api/profile"],
  });
  
  // Fetch selected query details
  const { 
    data: queryDetails, 
    isLoading: queryDetailsLoading,
    refetch: refetchQueryDetails
  } = useQuery<QueryDetailsResponse>({
    queryKey: [`/api/queries/${selectedQuery}`],
    enabled: !!selectedQuery,
  });

  // Create new query mutation
  const createQueryForm = useForm<QueryFormData>({
    resolver: zodResolver(queryFormSchema),
    defaultValues: {
      subject: "",
      description: ""
    }
  });

  const createQueryMutation = useMutation({
    mutationFn: async (data: QueryFormData) => {
      // Make sure we have the proctor data
      const profile = profileData as ProfileResponse | undefined;
      if (!profile?.proctor?.id) {
        throw new Error("No proctor assigned");
      }
      
      const payload = {
        ...data,
        proctorId: profile.proctor.id
      };
      
      const res = await apiRequest("POST", "/api/student/queries", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/queries"] });
      createQueryForm.reset();
      setIsNewQueryDialogOpen(false);
      toast({
        title: "Query submitted",
        description: "Your query has been sent to your proctor."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit query",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Respond to query mutation
  const responseForm = useForm<ResponseFormData>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      response: ""
    }
  });

  const respondToQueryMutation = useMutation({
    mutationFn: async (data: ResponseFormData) => {
      if (!selectedQuery) {
        throw new Error("No query selected");
      }
      
      return apiRequest("POST", `/api/queries/${selectedQuery}/respond`, data);
    },
    onSuccess: () => {
      refetchQueryDetails();
      responseForm.reset();
      setIsResponseDialogOpen(false);
      toast({
        title: "Response sent",
        description: "Your response has been added to the query."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send response",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Forms submission handlers
  const onSubmitNewQuery = (data: QueryFormData) => {
    createQueryMutation.mutate(data);
  };

  const onSubmitResponse = (data: ResponseFormData) => {
    respondToQueryMutation.mutate(data);
  };

  // Filter queries based on tab and search
  const queries = (queriesData as QueriesResponse)?.queries || [];
  const filteredQueries = queries.filter((query) => {
    const matchesTab = activeTab === "all" || query.status === activeTab;
    const matchesSearch = searchQuery.trim() === "" || 
      query.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      query.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // Helper function for query status badge
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'default';
      case 'pending':
        return 'destructive';
      case 'in_progress':
        return 'secondary';
      case 'closed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <Helmet>
        <title>My Queries | ProctorDiary</title>
        <meta name="description" content="View and manage your queries to your proctor in the ProctorDiary system." />
      </Helmet>
      
      <StudentLayout>
        <div className="px-4 sm:px-0">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-heading font-semibold text-gray-500">My Queries</h2>
              <p className="mt-1 text-sm text-gray-400">Manage communications with your proctor</p>
            </div>
            <Dialog open={isNewQueryDialogOpen} onOpenChange={setIsNewQueryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 sm:mt-0 bg-primary text-white hover:bg-primary/90">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Query
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Query</DialogTitle>
                </DialogHeader>
                <Form {...createQueryForm}>
                  <form onSubmit={createQueryForm.handleSubmit(onSubmitNewQuery)} className="space-y-4">
                    <FormField
                      control={createQueryForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter query subject" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createQueryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your query in detail" 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createQueryMutation.isPending || !profileData?.proctor}
                      >
                        {createQueryMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Submit Query
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
                {!profileData?.proctor && (
                  <p className="text-sm text-red-500 mt-2">
                    You don't have a proctor assigned yet. Please contact your administrator.
                  </p>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs 
              defaultValue="all" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-4 w-full sm:w-[400px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search queries..."
                className="pl-9 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-500">Query List</CardTitle>
              </CardHeader>
              <CardContent>
                {queriesLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredQueries.length > 0 ? (
                  <div className="space-y-2">
                    {filteredQueries.map((query) => (
                      <div 
                        key={query.id}
                        className={`p-3 border rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedQuery === query.id ? 'border-primary bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedQuery(query.id)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-gray-500">{query.subject}</h4>
                          <Badge variant={getStatusBadgeVariant(query.status)} className="ml-2">
                            {query.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(query.createdAt), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                          {query.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">No queries found</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-primary text-white hover:bg-primary/90">
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Create your first query
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-500">Query Details</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedQuery ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400">Select a query to view details</p>
                  </div>
                ) : queryDetailsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : queryDetails ? (
                  <div>
                    <div className="mb-6">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-medium text-gray-500">{(queryDetails as QueryDetailsResponse).query.subject}</h3>
                        <Badge variant={getStatusBadgeVariant((queryDetails as QueryDetailsResponse).query.status)}>
                          {(queryDetails as QueryDetailsResponse).query.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Created on {format(new Date((queryDetails as QueryDetailsResponse).query.createdAt), 'MMMM dd, yyyy')}
                      </p>
                      <div className="bg-gray-50 p-4 rounded-md mt-4">
                        <p className="text-gray-500 whitespace-pre-line">{(queryDetails as QueryDetailsResponse).query.description}</p>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h4 className="text-md font-medium text-gray-500 mb-4">Conversation</h4>
                      
                      <div className="space-y-4">
                        {(queryDetails as QueryDetailsResponse).responses && (queryDetails as QueryDetailsResponse).responses.length > 0 ? (
                          (queryDetails as QueryDetailsResponse).responses.map((response) => (
                            <div 
                              key={response.id}
                              className={`flex ${response.user.role === 'student' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  response.user.role === 'student' 
                                    ? 'bg-primary/10 text-primary-foreground'
                                    : 'bg-secondary/10 text-secondary-foreground'
                                }`}
                              >
                                <div className="flex items-center mb-1">
                                  <span className="text-xs font-medium">
                                    {response.user.name} ({response.user.role})
                                  </span>
                                  <span className="text-xs ml-2 text-gray-400">
                                    {format(new Date(response.createdAt), 'MMM dd, yyyy hh:mm a')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{response.response}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-400 py-4">No responses yet</p>
                        )}
                      </div>

                      {(queryDetails as QueryDetailsResponse).query.status !== 'closed' && (
                        <div className="mt-6">
                          <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
                            <DialogTrigger asChild>
                              <Button className="w-full">
                                <Send className="h-4 w-4 mr-2" />
                                Add Response
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Response</DialogTitle>
                              </DialogHeader>
                              <Form {...responseForm}>
                                <form onSubmit={responseForm.handleSubmit(onSubmitResponse)} className="space-y-4">
                                  <FormField
                                    control={responseForm.control}
                                    name="response"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Your Response</FormLabel>
                                        <FormControl>
                                          <Textarea 
                                            placeholder="Type your response here..." 
                                            className="min-h-[120px]" 
                                            {...field} 
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <DialogFooter>
                                    <Button 
                                      type="submit" 
                                      disabled={respondToQueryMutation.isPending}
                                    >
                                      {respondToQueryMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      )}
                                      Send Response
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Query details not found</p>
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

export default StudentQueriesPage;
