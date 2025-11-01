import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailIcon, PhoneIcon } from "lucide-react";
import { AvatarWithOnlineStatus } from "@/components/ui/avatar-with-online-status";

type ProctorInfo = {
  id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone?: string;
};

type ProctorInfoCardProps = {
  proctor?: ProctorInfo | null;
};

export const ProctorInfoCard = ({ proctor }: ProctorInfoCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-500">Your Proctor</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-5">
        {proctor ? (
          <div>
            <div className="flex items-center">
              <AvatarWithOnlineStatus
                src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&h=200&q=80"
                fallback={proctor.name.charAt(0).toUpperCase()}
                alt={proctor.name}
                size="lg"
              />
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-500">{proctor.name}</h4>
                <p className="text-gray-400 text-sm">{proctor.designation}, {proctor.department}</p>
                <div className="mt-2 flex items-center text-sm text-gray-400">
                  <MailIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {proctor.email}
                </div>
                {proctor.phone && (
                  <div className="mt-1 flex items-center text-sm text-gray-400">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {proctor.phone}
                  </div>
                )}
              </div>
            </div>
            <CardFooter className="mt-4 px-0 flex justify-end">
              <Button variant="ghost" className="text-primary hover:bg-blue-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <MailIcon className="h-4 w-4 mr-2" /> Contact
              </Button>
            </CardFooter>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-2">No proctor assigned yet</p>
            <p className="text-sm text-gray-400">
              You will be assigned a proctor soon
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
