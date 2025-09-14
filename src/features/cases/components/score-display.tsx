"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScoreDisplayProps {
  score: number;
  decision: "ACCEPT" | "REVIEW" | "DECLINE";
  decisionReasons: string[];
  scoredAt: Date;
  scoringVersion?: string;
}

export default function ScoreDisplay({
  score,
  decision,
  decisionReasons,
  scoredAt,
  scoringVersion,
}: ScoreDisplayProps) {
  const [showAllReasons, setShowAllReasons] = useState(false);
  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "ACCEPT":
        return "bg-green-50 text-green-800 border-green-200";
      case "REVIEW":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "DECLINE":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-slate-50 text-slate-800 border-slate-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-900">
          Case Score & Decision
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Score Display - Horizontal Layout */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            {/* Score */}
            <div className="text-center">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Score
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className="text-sm text-slate-400">/ 100</div>
            </div>

            {/* Decision */}
            <div className="text-center">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Decision
              </div>
              <Badge
                className={`px-4 py-2 text-sm font-semibold ${getDecisionColor(decision)} mt-1`}
              >
                {decision}
              </Badge>
            </div>
          </div>

          {/* Scoring Info */}
          <div className="text-right text-xs text-slate-500">
            <div>Scored: {new Date(scoredAt).toLocaleDateString()}</div>
            {scoringVersion && <div>{scoringVersion}</div>}
          </div>
        </div>

        {/* Decision Reasons - Horizontal Grid */}
        {decisionReasons.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700">
                Decision Reasons
              </h4>
              <span className="text-xs text-slate-500">
                {decisionReasons.length}{" "}
                {decisionReasons.length === 1 ? "reason" : "reasons"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(showAllReasons
                ? decisionReasons
                : decisionReasons.slice(0, 6)
              ).map((reason, index) => {
                // Determine if this is a positive or negative reason based on prefix
                const isPositive = reason.startsWith("+");
                const isNegative = reason.startsWith("-");
                const isNeutral = reason.startsWith("~");

                // Remove the prefix from the display text
                const displayText = reason.replace(/^[+\-~]\s*/, "");

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-3 rounded-lg ${
                      isPositive
                        ? "bg-green-50 hover:bg-green-100"
                        : isNegative
                          ? "bg-red-50 hover:bg-red-100"
                          : isNeutral
                            ? "bg-yellow-50 hover:bg-yellow-100"
                            : "bg-slate-50 hover:bg-slate-100"
                    } transition-colors duration-150`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        isPositive
                          ? "text-green-600"
                          : isNegative
                            ? "text-red-600"
                            : isNeutral
                              ? "text-yellow-600"
                              : "text-slate-400"
                      }`}
                    >
                      {isPositive
                        ? "+"
                        : isNegative
                          ? "−"
                          : isNeutral
                            ? "~"
                            : "•"}
                    </span>
                    <span className="text-sm text-slate-700 leading-relaxed">
                      {displayText}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Show more/less toggle if there are many reasons */}
            {decisionReasons.length > 6 && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowAllReasons(!showAllReasons)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  {showAllReasons
                    ? "Show less"
                    : `View all ${decisionReasons.length} reasons`}
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
