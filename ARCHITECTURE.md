# 🏗️ Architecture Guide

This document outlines the improved file structure and architectural patterns for the Case Intake System.

## 📁 File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── signup/
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── cases/                # Case management endpoints
│   │   ├── user/                 # User management endpoints
│   │   └── uploadthing/          # File upload endpoints
│   ├── cases/                    # Case pages
│   │   ├── [id]/                 # Individual case pages
│   │   └── page.tsx              # Cases listing page
│   ├── dashboard/                # Dashboard page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Shared UI components
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout components
│   └── ui/                       # Base UI components (shadcn)
├── constants/                    # Application constants
│   └── index.ts                  # Centralized constants
├── features/                     # Feature-based modules
│   ├── auth/                     # Authentication feature
│   ├── cases/                    # Case management feature
│   │   ├── components/           # Case-specific components
│   │   ├── hooks/                # Case-specific hooks
│   │   └── services/             # Case-specific services
│   ├── dashboard/                # Dashboard feature
│   └── upload/                   # File upload feature
├── hooks/                        # Custom React hooks
│   ├── use-case.ts               # Case-related hooks
│   └── use-form.ts               # Form-related hooks
├── lib/                          # Utility libraries
│   ├── ai/                       # AI/ML services
│   │   ├── deepgram.ts           # Transcription service
│   │   ├── extraction.ts         # Information extraction
│   │   └── scoring.ts            # Case scoring
│   ├── auth/                     # Authentication utilities
│   │   └── lucia.ts              # Auth configuration
│   ├── database/                 # Database utilities
│   │   └── db.ts                 # Prisma client
│   ├── email/                    # Email utilities
│   │   └── email.ts              # Email service
│   ├── validation/               # Validation utilities
│   │   ├── submit-validation.ts  # Form validation
│   │   └── clarifications.ts     # Clarification logic
│   ├── utils/                    # General utilities
│   │   ├── utils.ts              # Utility functions
│   │   └── design-system.ts      # Design system constants
│   ├── logger.ts                 # Logging utility
│   └── index.ts                  # Centralized exports
├── schemas/                      # Zod schemas
│   └── intake.ts                 # Intake form schema
├── services/                     # Business logic services
│   ├── case-service.ts           # Case business logic
│   └── user-service.ts           # User business logic
└── types/                        # TypeScript types
    └── index.ts                  # Centralized type definitions
```

## 🎯 Architectural Principles

### 1. **Feature-Based Organization**

- Each feature has its own folder with components, hooks, and services
- Clear separation of concerns
- Easy to locate feature-related code
- Scalable for new features

### 2. **Separation of Concerns**

- **Components**: UI presentation logic
- **Hooks**: Reusable stateful logic
- **Services**: Business logic and data operations
- **Types**: Type definitions and interfaces
- **Constants**: Configuration and static values

### 3. **Dependency Direction**

```
Components → Hooks → Services → Database
     ↓         ↓        ↓
   Types ← Constants ← Utils
```

### 4. **Import Strategy**

- Use absolute imports with `@/` alias
- Import from centralized index files
- Avoid deep relative imports
- Group imports by type (external, internal, relative)

## 🔧 Key Patterns

### **Service Layer Pattern**

```typescript
// services/case-service.ts
export class CaseService {
  static async getCases(userId: string, options: GetCasesOptions) {
    // Business logic here
  }
}
```

### **Custom Hooks Pattern**

```typescript
// hooks/use-case.ts
export function useCaseActions(caseId: string) {
  // Reusable case-related logic
}
```

### **Feature Components Pattern**

```typescript
// features/cases/components/case-card.tsx
export function CaseCard({ case, showActions }: CaseCardProps) {
  // Case-specific UI component
}
```

### **Centralized Types Pattern**

```typescript
// types/index.ts
export interface Case {
  /* ... */
}
export interface User {
  /* ... */
}
```

## 📋 Development Guidelines

### **Adding New Features**

1. **Create feature folder** in `src/features/`
2. **Add components** in `features/[feature]/components/`
3. **Add hooks** in `features/[feature]/hooks/` or `src/hooks/`
4. **Add services** in `features/[feature]/services/` or `src/services/`
5. **Add types** in `src/types/index.ts`
6. **Add constants** in `src/constants/index.ts`

### **Component Organization**

- **UI Components**: Reusable, generic components in `components/ui/`
- **Layout Components**: Layout-specific components in `components/layout/`
- **Form Components**: Form-specific components in `components/forms/`
- **Feature Components**: Feature-specific components in `features/[feature]/components/`

### **Import Guidelines**

```typescript
// ✅ Good - Centralized imports
import { CaseService } from "@/services/case-service";
import { useCaseActions } from "@/hooks/use-case";
import { Case, CaseStatus } from "@/types";

// ❌ Bad - Deep relative imports
import { CaseService } from "../../../services/case-service";
```

### **File Naming Conventions**

- **Components**: PascalCase (e.g., `CaseCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCase.ts`)
- **Services**: camelCase with `Service` suffix (e.g., `caseService.ts`)
- **Types**: camelCase (e.g., `index.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)

## 🚀 Benefits

### **Maintainability**

- Clear file organization
- Easy to locate code
- Consistent patterns
- Reduced cognitive load

### **Scalability**

- Feature-based structure
- Easy to add new features
- Clear boundaries
- Reusable components

### **Developer Experience**

- IntelliSense support
- Clear import paths
- Consistent patterns
- Easy refactoring

### **Code Quality**

- Separation of concerns
- Reusable logic
- Type safety
- Testable architecture

## 🔄 Migration Strategy

1. **Phase 1**: Create new structure alongside existing
2. **Phase 2**: Gradually move components to feature folders
3. **Phase 3**: Update imports to use centralized exports
4. **Phase 4**: Remove old file structure
5. **Phase 5**: Add comprehensive documentation

## 📚 Additional Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
