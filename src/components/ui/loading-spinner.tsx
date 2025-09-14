import { cn } from "@/lib/utils/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div
      className={cn(
        "border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin",
        sizeClasses[size],
        className
      )}
    />
  );
}
