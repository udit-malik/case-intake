// cache dash
export const revalidate = 300;

import { validateRequest } from "@/lib/auth/lucia";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UploadAudioDnd from "@/features/upload/components/upload-audio-dnd";
import { getDashboardStats, CaseQueries } from "@/lib/database/case.queries";
import Link from "next/link";
import AutoSettingsToggle from "@/features/dashboard/components/auto-settings-toggle";

export default async function DashboardPage() {
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  // get dash data + user prefs
  const [dashboardStats, userWithPrefs] = await Promise.all([
    getDashboardStats(user.id),
    CaseQueries.getUserPreferences(user.id),
  ]);

  const {
    recentCases: cases,
    totalCount,
    pendingCount,
    completedCount,
    thisWeekCount,
  } = dashboardStats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="mx-auto max-w-7xl p-6">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600 text-lg">
            Welcome back,{" "}
            <span className="font-medium text-slate-900">
              {(user as any).email}
            </span>
          </p>
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Cases
              </CardTitle>
              <svg
                className="h-4 w-4 text-slate-400"
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
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-slate-900">
                {totalCount}
              </div>
              <p className="text-xs text-slate-500">
                {totalCount === 0 ? "No cases yet" : "Total cases"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Pending Review
              </CardTitle>
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {pendingCount}
              </div>
              <p className="text-xs text-slate-500">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Completed
              </CardTitle>
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {completedCount}
              </div>
              <p className="text-xs text-slate-500">Cases completed</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                This Week
              </CardTitle>
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {thisWeekCount}
              </div>
              <p className="text-xs text-slate-500">New cases</p>
            </CardContent>
          </Card>
        </div>

        {/* new case intake */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-slate-900">
              New Case Intake
            </CardTitle>
            <CardDescription>
              Upload an audio file to start processing a new case
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadAudioDnd />
          </CardContent>
        </Card>

        {/* main */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* recent cases */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Recent Cases
              </CardTitle>
              <CardDescription>
                Your latest case intake activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    className="h-12 w-12 text-slate-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No cases yet
                  </h3>
                  <p className="text-slate-500 mb-4">
                    Start by uploading your first audio file above
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cases.map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      href={`/cases/${caseItem.id}`}
                      className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {caseItem.originalFilename}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(caseItem.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* score/decision */}
                          {(caseItem as any).score &&
                            (caseItem as any).decision && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  (caseItem as any).decision === "ACCEPT"
                                    ? "bg-green-100/50 text-green-700"
                                    : (caseItem as any).decision === "DECLINE"
                                      ? "bg-red-100/50 text-red-700"
                                      : "bg-amber-100/50 text-amber-700"
                                }`}
                              >
                                <span className="font-semibold">{(caseItem as any).score}</span>
                                <span className="mx-1 text-slate-400">•</span>
                                <span className="text-xs">{(caseItem as any).decision}</span>
                              </span>
                            )}

                          {/* status */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              caseItem.status === "UPLOADED"
                                ? "bg-amber-100/50 text-amber-700"
                                : caseItem.status === "TRANSCRIBED"
                                  ? "bg-blue-100/50 text-blue-700"
                                  : caseItem.status === "EXTRACTED"
                                    ? "bg-slate-100/50 text-slate-700"
                                    : caseItem.status === "SCORED"
                                      ? "bg-orange-100/50 text-orange-700"
                                      : caseItem.status === "DECIDED"
                                        ? "bg-green-100/50 text-green-700"
                                        : "bg-slate-100/50 text-slate-700"
                            }`}
                          >
                            {caseItem.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* quick actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/cases" className="no-underline inline-block">
                <Button className="group relative overflow-hidden justify-start bg-slate-600 hover:bg-slate-700 text-white border-slate-600 hover:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200">
                  <svg
                    className="mr-2 h-4 w-4 transition-transform group-hover:scale-105"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span className="font-medium">View All Cases</span>
                  
                  {/* subtle hover effect overlay */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                </Button>
              </Link>

              {/* automation settings */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-900 mb-3">
                  Automation Settings
                </h4>
                <AutoSettingsToggle
                  userId={user.id}
                  initialAutoTranscribe={userWithPrefs?.autoTranscribe || false}
                  initialAutoExtract={userWithPrefs?.autoExtract || false}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
