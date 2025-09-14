import "./globals.css";
import type { Metadata } from "next";
import ClientSiteHeader from "@/features/layout/components/client-site-header";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Case Intake",
  description: "Semi-autonomous case intake",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">
        {/* UploadThing SSR wiring */}
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <ClientSiteHeader />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
