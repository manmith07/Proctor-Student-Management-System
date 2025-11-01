import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarWithOnlineStatusProps {
  src?: string;
  fallback: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "offline" | "away" | "busy" | "none";
}

export function AvatarWithOnlineStatus({
  src,
  fallback,
  alt,
  size = "md",
  status = "none",
}: AvatarWithOnlineStatusProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const statusColor = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-amber-500",
    busy: "bg-red-500",
    none: "hidden",
  };

  const statusPosition = {
    sm: "bottom-0 right-0 h-2 w-2",
    md: "bottom-0 right-0 h-3 w-3",
    lg: "bottom-1 right-1 h-4 w-4",
  };

  return (
    <div className="relative">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={src} alt={alt || fallback} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {status !== "none" && (
        <div
          className={`absolute rounded-full border-2 border-white ${statusColor[status]} ${statusPosition[size]}`}
        />
      )}
    </div>
  );
}
