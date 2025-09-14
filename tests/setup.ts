import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Next.js image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', props);
  },
}));

// Mock environment variables
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  AUTH_SECRET: 'test-secret',
  OPENAI_API_KEY: 'test-openai-key',
  DEEPGRAM_API_KEY: 'test-deepgram-key',
  UPLOADTHING_SECRET: 'test-uploadthing-secret',
  UPLOADTHING_APP_ID: 'test-uploadthing-app-id',
  RESEND_API_KEY: 'test-resend-key',
  RESEND_FROM_EMAIL: 'test@example.com',
});

// Mock window to be undefined for server-only modules
Object.defineProperty(global, 'window', {
  value: undefined,
  writable: true,
});

// Mock React DOM for testing
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

// Mock react-dom for compatibility
vi.mock('react-dom', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
  render: vi.fn(),
  unmountComponentAtNode: vi.fn(),
}));

// Mock server-only package
vi.mock('server-only', () => ({}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock server-only modules
vi.mock('../../src/lib/ai', () => ({
  scoreCase: vi.fn().mockResolvedValue({
    score: 75,
    decision: 'ACCEPT',
    reasons: ['Strong case'],
    clarifications: [],
    breakdown: [],
    trace: {},
  }),
  buildFeatures: vi.fn().mockResolvedValue({
    case_type: 'MVA_REAR_END',
    booleans: {},
    numbers: {},
    strings: {},
    arrays: {},
    evidence: {},
  }),
  CaseType: {
    MVA_REAR_END: 'MVA_REAR_END',
    MVA_LEFT_TURN: 'MVA_LEFT_TURN',
    MVA_T_BONE: 'MVA_T_BONE',
    MVA_SIDESWIPE: 'MVA_SIDESWIPE',
    PREMISES_WET_FLOOR: 'PREMISES_WET_FLOOR',
    PREMISES_ICE_SNOW: 'PREMISES_ICE_SNOW',
    PREMISES_TRIP_HAZARD: 'PREMISES_TRIP_HAZARD',
    DOG_BITE: 'DOG_BITE',
    PEDESTRIAN_OR_BICYCLE: 'PEDESTRIAN_OR_BICYCLE',
    RIDESHARE_MVA: 'RIDESHARE_MVA',
    OTHER: 'OTHER',
  },
}));

vi.mock('../../src/lib/ai/index', () => ({
  scoreCase: vi.fn().mockResolvedValue({
    score: 75,
    decision: 'ACCEPT',
    reasons: ['Strong case'],
    clarifications: [],
    breakdown: [],
    trace: {},
  }),
  buildFeatures: vi.fn().mockResolvedValue({
    case_type: 'MVA_REAR_END',
    booleans: {},
    numbers: {},
    strings: {},
    arrays: {},
    evidence: {},
  }),
  CaseType: {
    MVA_REAR_END: 'MVA_REAR_END',
    MVA_LEFT_TURN: 'MVA_LEFT_TURN',
    MVA_T_BONE: 'MVA_T_BONE',
    MVA_SIDESWIPE: 'MVA_SIDESWIPE',
    PREMISES_WET_FLOOR: 'PREMISES_WET_FLOOR',
    PREMISES_ICE_SNOW: 'PREMISES_ICE_SNOW',
    PREMISES_TRIP_HAZARD: 'PREMISES_TRIP_HAZARD',
    DOG_BITE: 'DOG_BITE',
    PEDESTRIAN_OR_BICYCLE: 'PEDESTRIAN_OR_BICYCLE',
    RIDESHARE_MVA: 'RIDESHARE_MVA',
    OTHER: 'OTHER',
  },
}));

vi.mock('../../src/lib/ai/scoring-engine', () => ({
  scoreCase: vi.fn().mockResolvedValue({
    score: 75,
    decision: 'ACCEPT',
    reasons: ['Strong case'],
    clarifications: [],
    breakdown: [],
    trace: {},
  }),
}));

vi.mock('../../src/lib/ai/feature-extraction', () => ({
  buildFeatures: vi.fn().mockResolvedValue({
    case_type: 'MVA_REAR_END',
    booleans: {},
    numbers: {},
    strings: {},
    arrays: {},
    evidence: {},
  }),
}));

vi.mock('../../src/lib/database/case.queries', () => ({
  getCaseById: vi.fn(),
  getCasesByUserId: vi.fn(),
  create: vi.fn().mockResolvedValue({
    id: 'test-case-id',
    userId: 'test-user-id',
    status: 'UPLOADED',
    fileKey: 'test-file-key',
    fileUrl: 'https://example.com/audio.mp3',
    originalFilename: 'test-audio.mp3',
    mimeType: 'audio/mpeg',
    audioSha256: null,
    durationSec: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateCase: vi.fn(),
  deleteCase: vi.fn(),
  findByIdForService: vi.fn().mockResolvedValue({
    id: 'test-case-id',
    userId: 'test-user-id',
    status: 'UPLOADED',
    fileKey: 'test-file-key',
    fileUrl: 'https://example.com/audio.mp3',
    originalFilename: 'test-audio.mp3',
    mimeType: 'audio/mpeg',
    audioSha256: null,
    durationSec: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  findRecentForDashboard: vi.fn(),
}));

vi.mock('../../src/lib/case.service', () => ({
  createCase: vi.fn(),
  transcribeCase: vi.fn(),
  extractCase: vi.fn(),
  scoreCase: vi.fn(),
  submitDecision: vi.fn(),
  deleteCase: vi.fn(),
}));

vi.mock('../../src/lib/database/db', () => ({
  prisma: {
    case: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
