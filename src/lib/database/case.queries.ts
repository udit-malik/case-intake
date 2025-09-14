if (typeof window !== "undefined") {
  throw new Error("case.queries.ts is server-only");
}

import { prisma } from "@/lib/database/db";
import type { PaginationOptions } from "@/types";


export const CaseSelectors = {
  // case info for lists
  listItem: {
    id: true,
    status: true,
    originalFilename: true,
    createdAt: true,
    score: true,
    decision: true,
    submittedAt: true,
  },

  // dash case info
  dashboard: {
    id: true,
    status: true,
    originalFilename: true,
    createdAt: true,
    score: true,
    decision: true,
  },

  // full case details
  details: {
    id: true,
    status: true,
    originalFilename: true,
    createdAt: true,
    intakeDraft: true,
    clarificationNeeded: true,
    score: true,
    decision: true,
    decisionReasons: true,
    scoredAt: true,
    scoringVersion: true,
    transcriptText: true,
    submittedAt: true,
  },

  service: {
    id: true,
    userId: true,
    status: true,
    fileKey: true,
    fileUrl: true,
    originalFilename: true,
    mimeType: true,
    transcriptText: true,
    transcriptJson: true,
    transcribedAt: true,
    deepgramModel: true,
    deepgramRequestId: true,
    extractedAt: true,
    extractionModel: true,
    extractionRequestId: true,
    extractionJson: true,
    intakeDraft: true,
    clarificationNeeded: true,
    score: true,
    decision: true,
    decisionReasons: true,
    scoredAt: true,
    scoringVersion: true,
    scoringTrace: true,
    submittedAt: true,
    decisionEmailId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    deletedReason: true,
  },
} as const;

export const CaseFilters = {
  userCases: (userId: string) => ({
    userId,
    deletedAt: null,
  }),

  userCasesByStatus: (userId: string, status: string) => ({
    userId,
    deletedAt: null,
    status,
  }),

  userCaseById: (id: string, userId: string) => ({
    id,
    userId,
    deletedAt: null,
  }),

  caseById: (id: string, userId: string) => ({
    id,
    userId,
  }),
} as const;


export const CaseQueries = {
  async findById(id: string, userId: string) {
    return prisma.case.findFirst({
      where: CaseFilters.userCaseById(id, userId),
      select: CaseSelectors.details,
    });
  },

  // includes deleted
  async findByIdForService(id: string, userId: string) {
    return prisma.case.findFirst({
      where: CaseFilters.caseById(id, userId),
      select: CaseSelectors.service,
    });
  },

  // recent cases
  async findRecentForDashboard(userId: string, limit: number = 10) {
    return prisma.case.findMany({
      where: CaseFilters.userCases(userId),
      orderBy: { createdAt: "desc" },
      take: limit,
      select: CaseSelectors.dashboard,
    });
  },

  async findUserCases(
    userId: string,
    options: PaginationOptions & { status?: string } = {}
  ) {
    const { status, ...paginationOptions } = options;

    const where =
      status && status !== "ALL"
        ? CaseFilters.userCasesByStatus(userId, status)
        : CaseFilters.userCases(userId);

    return prisma.case.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...paginationOptions,
      select: CaseSelectors.listItem,
    });
  },


  async countUserCases(userId: string, status?: string) {
    const where =
      status && status !== "ALL"
        ? CaseFilters.userCasesByStatus(userId, status)
        : CaseFilters.userCases(userId);

    return prisma.case.count({ where });
  },

  
  async getStatusCounts(userId: string) {
    const baseWhere = { userId, deletedAt: null };

    return Promise.all([
      prisma.case.count({ where: baseWhere }),
      prisma.case.count({ where: { ...baseWhere, status: "UPLOADED" } }),
      prisma.case.count({ where: { ...baseWhere, status: "TRANSCRIBED" } }),
      prisma.case.count({ where: { ...baseWhere, status: "EXTRACTED" } }),
      prisma.case.count({ where: { ...baseWhere, status: "SCORED" } }),
      prisma.case.count({ where: { ...baseWhere, status: "DECIDED" } }),
    ]);
  },

  
  async getUserPreferences(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        autoTranscribe: true,
        autoExtract: true,
      },
    });
  },

  async create(data: any) {
    return prisma.case.create({ data });
  },

  async update(id: string, data: any) {
    return prisma.case.update({
      where: { id },
      data,
    });
  },

  async softDelete(id: string, userId: string, deletedReason?: string) {
    return prisma.case.update({
      where: { id, userId },
      data: {
        deletedAt: new Date(),
        deletedReason,
      },
    });
  },
} as const;

// dash stats
export async function getDashboardStats(userId: string) {
  const [recentCases, totalCount] = await Promise.all([
    CaseQueries.findRecentForDashboard(userId, 10),
    CaseQueries.countUserCases(userId),
  ]);

  // calc stats from recent cases
  const pendingCount = recentCases.filter((c) =>
    ["UPLOADED", "TRANSCRIBED", "EXTRACTED"].includes(c.status)
  ).length;

  const completedCount = recentCases.filter(
    (c) => c.status === "DECIDED"
  ).length;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekCount = recentCases.filter((c) => c.createdAt > weekAgo).length;

  return {
    recentCases,
    totalCount,
    pendingCount,
    completedCount,
    thisWeekCount,
  };
}

// get cases page data
export async function getCasesPageData(
  userId: string,
  page: number = 1,
  status?: string,
  itemsPerPage: number = 20
) {
  const offset = (page - 1) * itemsPerPage;

  const [cases, totalCount, statusCounts] = await Promise.all([
    CaseQueries.findUserCases(userId, {
      skip: offset,
      take: itemsPerPage,
      status,
    }),
    CaseQueries.countUserCases(userId, status),
    CaseQueries.getStatusCounts(userId),
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const [
    allCount,
    uploadedCount,
    transcribedCount,
    extractedCount,
    scoredCount,
    decidedCount,
  ] = statusCounts;

  return {
    cases,
    totalCount,
    totalPages,
    currentPage: page,
    statusCounts: {
      all: allCount,
      uploaded: uploadedCount,
      transcribed: transcribedCount,
      extracted: extractedCount,
      scored: scoredCount,
      decided: decidedCount,
    },
  };
}
