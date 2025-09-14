"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/features/auth/components/logout-button";
import { isAuthResponse, User } from "@/types";
import { authApi } from "@/lib/api-client";
import { logger } from "@/lib/logger";

export default function ClientSiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // check auth status on mount + when the component updates
    const checkAuth = async () => {
      try {
        const response = await authApi.getCurrentUser();

        // runtime type validation
        if (isAuthResponse(response) && response.data?.user) {
          // conv to full User type with defaults
          setUser({
            ...response.data.user,
            autoTranscribe: false,
            autoExtract: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          logger.warn("Invalid auth response format", { response });
          setUser(null);
        }
      } catch (error) {
        logger.error("Auth check failed", { error });
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // listen for storage events to update auth state across tabs
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);

    // listen for custom auth events
    window.addEventListener("auth-changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-changed", handleStorageChange);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900">Case Intake</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
              <div className="w-16 h-8 bg-slate-200 rounded animate-pulse" />
            </div>
          ) : user ? (
            <>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <LogoutButton />
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
