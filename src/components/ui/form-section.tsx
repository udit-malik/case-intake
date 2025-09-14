import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <Card className={`bg-white border border-slate-200 shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-slate-900">
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">{children}</CardContent>
    </Card>
  );
}
