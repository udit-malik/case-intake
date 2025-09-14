// cache case details for performance (1 minute)
export const revalidate = 60;

import { validateRequest } from "@/lib/auth/lucia";
import { redirect, notFound } from "next/navigation";
import { CaseQueries } from "@/lib/database/case.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import CasePageClient from "@/features/cases/components/case-page-client";
import DeleteCaseButton from "@/features/cases/components/delete-case-button";
import { getMissingSubmitFields } from "@/lib/validation/submit-validation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CasePage({ params }: PageProps) {
  const { user } = await validateRequest();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const caseRecord = await CaseQueries.findById(id, user.id);

  if (!caseRecord) {
    notFound();
  }

  const missingSubmitKeys = getMissingSubmitFields(
    (caseRecord as any).intakeDraft || {}
  );
  const clarifications = (caseRecord as any).clarificationNeeded || [];

  // get client name from intake draft
  const clientName =
    (caseRecord as any).intakeDraft?.client_name || "Unknown Client";

  const getStepStatus = (currentStatus: string, stepKey: string) => {
    const statusOrder = [
      "UPLOADED",
      "TRANSCRIBED",
      "EXTRACTED",
      "SCORED",
      "DECIDED",
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex <= currentIndex) return "completed";
    if (stepIndex === currentIndex + 1) return "pending";
    return "waiting";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="mx-auto max-w-7xl p-6 pt-16">
        {/* header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Case: {clientName}
              </h1>
              <p className="text-slate-600">{caseRecord.originalFilename}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/cases"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back to Cases
              </Link>
              <DeleteCaseButton caseId={caseRecord.id} />
            </div>
          </div>
        </div>

        {/* status */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">
              Case Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* progress flow */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  {[
                    {
                      key: "UPLOADED",
                      label: "Upload",
                      icon: "📁",
                      description: "Audio file uploaded",
                    },
                    {
                      key: "TRANSCRIBED",
                      label: "Transcription",
                      icon: "🎤",
                      description: "Speech converted to text",
                    },
                    {
                      key: "EXTRACTED",
                      label: "Extraction",
                      icon: "📝",
                      description: "Data extracted from transcript",
                    },
                    {
                      key: "SCORED",
                      label: "Scoring",
                      icon: "📊",
                      description: "Case evaluated and scored",
                    },
                    {
                      key: "DECIDED",
                      label: "Decision",
                      icon: "✅",
                      description: "Final decision submitted",
                    },
                  ].map((step, index) => {
                    const stepStatus = getStepStatus(caseRecord.status, step.key);
                    const isCompleted = stepStatus === "completed";
                    const isPending = stepStatus === "pending";
                    const isWaiting = stepStatus === "waiting";

                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center relative"
                      >
                        {/* step */}
                        <div
                          className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : isPending
                                ? "bg-blue-500 text-white"
                                : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {isCompleted && (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>

                        {/* step label */}
                        <div className="mt-3 text-center">
                          <div
                            className={`text-sm font-semibold transition-colors ${
                              isCompleted || isPending
                                ? "text-slate-900"
                                : "text-slate-500"
                            }`}
                          >
                            {step.label}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {step.description}
                          </div>
                        </div>

                        {/* line */}
                        {index < 4 && (
                          <div className="absolute top-3 left-1/2 w-full h-0.5 -z-10">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isCompleted ? "bg-green-300" : isPending ? "bg-blue-300" : "bg-slate-200"
                              }`}
                              style={{ width: "calc(100% - 1.5rem)" }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">Created</div>
                <div className="text-sm font-medium text-slate-700">
                  {new Date(caseRecord.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* case content */}
        <CasePageClient
          caseId={caseRecord.id}
          status={caseRecord.status}
          hasScore={!!caseRecord.score}
          initialData={caseRecord.intakeDraft as any}
          showScoreButton={
            caseRecord.status === "EXTRACTED" && !caseRecord.score
          }
          missingSubmitKeys={missingSubmitKeys}
          clarifications={clarifications}
          score={caseRecord.score || undefined}
          decision={caseRecord.decision || undefined}
          decisionReasons={caseRecord.decisionReasons || []}
          scoredAt={caseRecord.scoredAt || undefined}
          scoringVersion={caseRecord.scoringVersion || undefined}
          transcriptText={caseRecord.transcriptText || undefined}
          submittedAt={caseRecord.submittedAt || undefined}
        />
      </main>
    </div>
  );
}
