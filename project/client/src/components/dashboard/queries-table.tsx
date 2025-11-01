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
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Query } from "@shared/schema";

const queryFormSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type QueryFormData = z.infer<typeof queryFormSchema>;

type QueriesTableProps = {
  queries: Query[];
  loading?: boolean;
  className?: string;
};

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

export const QueriesTable = ({ queries = [], loading = false, className = "" }: QueriesTableProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const form = useForm<QueryFormData>({
    resolver: zodResolver(queryFormSchema),
    defaultValues: {
      subject: "",
      description: ""
    }
  });

  const createQueryMutation = useMutation({
    mutationFn: async (data: QueryFormData) => {
      // In a real app, the proctor ID would come from the student's profile
      // This is just a placeholder
      const proctorId = 1; 
      return apiRequest("POST", "/api/student/queries", {
        ...data,
        proctorId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/queries"] });
      form.reset();
      setOpen(false);
    },
  });

  const onSubmit = (data: QueryFormData) => {
    createQueryMutation.mutate(data);
  };

  return (
    <Card className={className}>
      <CardHeader className="border-b border-gray-200 flex-row justify-between items-center px-6 py-5">
        <CardTitle className="text-lg font-medium text-gray-500">Recent Queries</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Query
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Query</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                    disabled={createQueryMutation.isPending}
                  >
                    {createQueryMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Query
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="px-6 py-5">
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : queries.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell className="font-medium text-gray-500">
                      {query.subject}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {format(new Date(query.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(query.status)}>
                        {query.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {format(new Date(query.updatedAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="link" 
                        className="text-primary hover:text-primary/80"
                        onClick={() => setLocation(user?.role === 'proctor' ? `/proctor/queries/${query.id}` : `/student/queries/${query.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No queries yet</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create your first query
                </Button>
              </DialogTrigger>
              {/* Dialog content is the same as above */}
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
