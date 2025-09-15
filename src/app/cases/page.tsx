// cache case list for 2min
export const revalidate = 120;

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
import { getCasesPageData } from "@/lib/database/case.queries";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function CasesPage({ searchParams }: PageProps) {
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  const { page = "1", status } = await searchParams;
  const currentPage = parseInt(page);
  const itemsPerPage = 20;

  // get all cases
  const { cases, totalCount, totalPages, statusCounts } =
    await getCasesPageData(user.id, currentPage, status, itemsPerPage);

  const statusFilters = [
    { key: "ALL", label: "All Cases", count: statusCounts.all },
    { key: "UPLOADED", label: "Uploaded", count: statusCounts.uploaded },
    {
      key: "TRANSCRIBED",
      label: "Transcribed",
      count: statusCounts.transcribed,
    },
    { key: "EXTRACTED", label: "Extracted", count: statusCounts.extracted },
    { key: "SCORED", label: "Scored", count: statusCounts.scored },
    { key: "DECIDED", label: "Decided", count: statusCounts.decided },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="mx-auto max-w-7xl p-6">
        {/* header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                All Cases
              </h1>
              <p className="text-slate-600 text-lg">
                View and manage all your case intake activities
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Link
                key={filter.key}
                href={`/cases?status=${filter.key}&page=1`}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  status === filter.key || (!status && filter.key === "ALL")
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter.label} ({filter.count})
              </Link>
            ))}
          </div>
        </div>

        {/* case List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">
              {status ? `${status} Cases` : "All Cases"} ({totalCount})
            </CardTitle>
            <CardDescription>
              {totalCount === 0
                ? "No cases found"
                : `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} cases`}
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
                  No cases found
                </h3>
                <p className="text-slate-500 mb-4">
                  {status
                    ? `No cases with status "${status}" found`
                    : "You haven't created any cases yet"}
                </p>
                <Link href="/dashboard">
                  <Button>
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Create New Case
                  </Button>
                </Link>
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
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-slate-500">
                            Created:{" "}
                            {new Date(caseItem.createdAt).toLocaleDateString()}
                          </p>
                          {caseItem.submittedAt && (
                            <p className="text-xs text-slate-500">
                              Submitted:{" "}
                              {new Date(
                                caseItem.submittedAt
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* score */}
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

        {/* pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              {/* prev button */}
              {currentPage > 1 && (
                <Link
                  href={`/cases?${new URLSearchParams({
                    ...(status && { status }),
                    page: (currentPage - 1).toString(),
                  })}`}
                >
                  <Button variant="outline" size="sm">
                    <svg
                      className="mr-1 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </Button>
                </Link>
              )}

              {/* page nums */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;

                  return (
                    <Link
                      key={pageNum}
                      href={`/cases?${new URLSearchParams({
                        ...(status && { status }),
                        page: pageNum.toString(),
                      })}`}
                    >
                      <Button
                        variant={
                          pageNum === currentPage ? "default" : "outline"
                        }
                        size="sm"
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    </Link>
                  );
                })}
              </div>

              {/* next button */}
              {currentPage < totalPages && (
                <Link
                  href={`/cases?${new URLSearchParams({
                    ...(status && { status }),
                    page: (currentPage + 1).toString(),
                  })}`}
                >
                  <Button variant="outline" size="sm">
                    Next
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
