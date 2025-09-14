import * as React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div">;

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-slate-200 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("px-6 py-4 border-b border-slate-200", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-lg font-semibold text-slate-900", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6 py-4", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-slate-600", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardContent, CardDescription };
