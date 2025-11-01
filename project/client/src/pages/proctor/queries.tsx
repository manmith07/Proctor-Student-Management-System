import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ProctorLayout from "@/components/layout/proctor-layout";
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
  DialogDescription
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { 
  Loader2, 
  MessageSquare,
  Send,
  Search,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AvatarWithOnlineStatus } from "@/components/ui/avatar-with-online-status";

// Form schema for response
const responseFormSchema = z.object({
  response: z.string().min(1, "Response cannot be empty"),
});

// Form schema for status update
const statusUpdateSchema = z.object({
  status: z.enum(["pending", "in_progress", "resolved", "closed"]),
});

type ResponseFormData = z.infer<typeof responseFormSchema>;
type StatusUpdateData = z.infer<typeof statusUpdateSchema>;

interface Query {
  id: number;
  subject: string;
  description: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  student?: {
    id: number;
    name: string;
    email: string;
  };
}

interface QueriesResponse {
  queries: Query[];
}

interface QueryDetails {
  query: {
    id: number;
    subject: string;
    description: string;
    status: "pending" | "in_progress" | "resolved" | "closed";
    createdAt: string;
    updatedAt: string;
  };
  student: {
    id: number;
    name: string;
    email: string;
  } | null;
  responses: Array<{
    id: number;
    response: string;
    createdAt: string;
    user: {
      id: number;
      name: string;
      role: string;
    };
  }>;
}

const ProctorQueriesPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedQuery, setSelectedQuery] = useState<number | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch queries
  const { 
    data: queriesData, 
    isLoading: queriesLoading
  } = useQuery<QueriesResponse>({
    queryKey: ["/api/proctor/queries"],
  });
  
  // Fetch selected query details
  const { 
    data: queryDetails, 
    isLoading: queryDetailsLoading,
    refetch: refetchQueryDetails
  } = useQuery<QueryDetails>({
    queryKey: [`/api/queries/${selectedQuery}`],
    enabled: !!selectedQuery,
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
      
      console.log("Submitting response:", data, "for query:", selectedQuery);
      
      return apiRequest("POST", `/api/queries/${selectedQuery}/respond`, data);
    },
    onSuccess: () => {
      refetchQueryDetails();
      queryClient.invalidateQueries({ queryKey: [`/api/queries/${selectedQuery}`] });
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

  // Update query status mutation
  const statusForm = useForm<StatusUpdateData>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: queryDetails?.query.status as any || "pending"
    }
  });

  const updateQueryStatusMutation = useMutation({
    mutationFn: async (data: StatusUpdateData) => {
      if (!selectedQuery) {
        throw new Error("No query selected");
      }
      
      return apiRequest("PATCH", `/api/proctor/queries/${selectedQuery}/status`, data);
    },
    onSuccess: () => {
      refetchQueryDetails();
      queryClient.invalidateQueries({ queryKey: ["/api/proctor/queries"] });
      setIsStatusDialogOpen(false);
      toast({
        title: "Status updated",
        description: "The query status has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Forms submission handlers
  const onSubmitResponse = (data: ResponseFormData) => {
    respondToQueryMutation.mutate(data);
  };

  const onSubmitStatusUpdate = (data: StatusUpdateData) => {
    updateQueryStatusMutation.mutate(data);
  };

  // Reset status form when query details change
  useEffect(() => {
    if (queryDetails) {
      statusForm.reset({
        status: queryDetails.query.status as any
      });
    }
  }, [queryDetails, statusForm]);

  // Helper function for query status badge
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'resolved':
        return 'default';
      case 'pending':
        return 'destructive';
      case 'in_progress':
        return 'secondary';
      case 'closed':
      default:
        return 'outline';
    }
  };

  const queries = queriesData?.queries || [];
  const filteredQueries = queries.filter((query: Query) => {
    const matchesTab = activeTab === "all" || query.status === activeTab;
    const matchesSearch = searchQuery.trim() === "" || 
      query.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      query.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      query.student?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  return (
    <>
      <Helmet>
        <title>Manage Queries | ProctorDiary</title>
        <meta name="description" content="View and respond to student queries in the ProctorDiary system." />
      </Helmet>
      
      <ProctorLayout>
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-semibold text-gray-500">Student Queries</h2>
            <p className="mt-1 text-sm text-gray-400">Manage and respond to student inquiries</p>
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
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                  </div>
                ) : filteredQueries.length > 0 ? (
                  <div className="space-y-2">
                    {filteredQueries.map((query) => (
                      <div 
                        key={query.id}
                        className={`p-3 border rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedQuery === query.id ? 'border-secondary bg-green-50' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedQuery(query.id)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-gray-500">{query.subject}</h4>
                          <Badge variant={getStatusBadgeVariant(query.status)} className="ml-2">
                            {query.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center mt-1">
                          <AvatarWithOnlineStatus
                            fallback={query.student?.name.charAt(0) || "?"}
                            size="sm"
                          />
                          <p className="text-xs text-gray-400 ml-2">
                            From: {query.student?.name || "Unknown"}
                          </p>
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
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                  </div>
                ) : queryDetails ? (
                  <div>
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-medium text-gray-500">{queryDetails.query.subject}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusBadgeVariant(queryDetails.query.status)}>
                            {queryDetails.query.status.replace('_', ' ')}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsStatusDialogOpen(true)}
                          >
                            Update Status
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center mb-2">
                        <AvatarWithOnlineStatus
                          fallback={queryDetails.student?.name.charAt(0) || "?"}
                          size="sm"
                        />
                        <div className="ml-2">
                          <p className="text-sm text-gray-500">{queryDetails.student?.name}</p>
                          <p className="text-xs text-gray-400">{queryDetails.student?.email}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">
                        Created on {format(new Date(queryDetails.query.createdAt), 'MMMM dd, yyyy')}
                      </p>
                      <div className="bg-gray-50 p-4 rounded-md mt-4">
                        <p className="text-gray-500 whitespace-pre-line">{queryDetails.query.description}</p>
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-medium text-gray-500">Conversation</h4>
                        {queryDetails.query.status !== 'closed' && (
                          <Button 
                            variant="default"
                            className="bg-primary text-white hover:bg-primary/90"
                            onClick={() => setIsResponseDialogOpen(true)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Respond to Query
                          </Button>
                        )}
                      </div>
                      
                      {/* Add a prominent response section when there are no responses */}
                      {(!queryDetails.responses || queryDetails.responses.length === 0) && queryDetails.query.status !== 'closed' && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                              <p className="text-amber-700">This query is awaiting your response.</p>
                            </div>
                            <Button 
                              variant="default"
                              className="bg-amber-600 text-white hover:bg-amber-700"
                              onClick={() => setIsResponseDialogOpen(true)}
                            >
                              Respond Now
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {queryDetails.responses && queryDetails.responses.length > 0 ? (
                          queryDetails.responses.map((response) => (
                            <div 
                              key={response.id}
                              className={`flex ${response.user.role === 'proctor' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  response.user.role === 'proctor' 
                                    ? 'bg-secondary/10 text-secondary-foreground'
                                    : 'bg-primary/10 text-primary-foreground'
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
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                            <div className="flex items-center">
                              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                              <p className="text-amber-700">This query is awaiting your response.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Update Status Dialog */}
                    <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Query Status</DialogTitle>
                          <DialogDescription>
                            Change the current status of this query.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...statusForm}>
                          <form onSubmit={statusForm.handleSubmit(onSubmitStatusUpdate)} className="space-y-4">
                            <FormField
                              control={statusForm.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                      <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button
                                type="submit"
                                variant="secondary"
                                disabled={updateQueryStatusMutation.isPending}
                              >
                                {updateQueryStatusMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Update Status
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    {/* Response Dialog */}
                    <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Respond to Student Query</DialogTitle>
                        </DialogHeader>
                        
                        {queryDetails && (
                          <div className="bg-blue-50 p-4 rounded-md mb-4 border border-blue-100">
                            <div className="flex items-center mb-2">
                              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                                <span className="text-xs text-primary font-medium">{queryDetails.student?.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{queryDetails.student?.name}</p>
                                <p className="text-xs text-gray-500">{format(new Date(queryDetails.query.createdAt), 'MMM dd, yyyy')}</p>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-1">"{queryDetails.query.subject}"</p>
                            <p className="text-sm text-gray-600 italic">{queryDetails.query.description.slice(0, 100)}{queryDetails.query.description.length > 100 ? '...' : ''}</p>
                          </div>
                        )}
                        
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
                                className="bg-primary text-white hover:bg-primary/90"
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
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Query details not found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ProctorLayout>
    </>
  );
};

export default ProctorQueriesPage;
