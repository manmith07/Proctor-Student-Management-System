import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Query } from "@shared/schema";
import { format } from "date-fns";

type QueryCardProps = {
  queries: (Query & { student?: { id: number; name: string; email: string } })[];
  loading?: boolean;
  className?: string;
};

export const QueryCard = ({ queries = [], loading = false, className = "" }: QueryCardProps) => {
  const [, setLocation] = useLocation();

  const getBadgeVariant = (status: string) => {
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
    <Card className={className}>
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-500">Recent Queries</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-5">
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : queries.length > 0 ? (
          <div className="space-y-4">
            {queries.map((query) => (
              <div key={query.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">{query.subject}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      From: {query.student?.name || "Unknown Student"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(query.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge variant={getBadgeVariant(query.status)}>
                    {query.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                  {query.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No queries yet</p>
          </div>
        )}

        {queries.length > 0 && (
          <CardFooter className="mt-5 px-0 flex justify-center">
            <Button 
              variant="outline" 
              className="text-secondary border-secondary hover:bg-secondary/5"
              onClick={() => setLocation('/proctor/queries')}
            >
              View All Queries
            </Button>
          </CardFooter>
        )}
      </CardContent>
    </Card>
  );
};
