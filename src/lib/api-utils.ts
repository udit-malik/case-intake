import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateRequest as luciaValidateRequest } from "@/lib/auth/lucia";
import { handleApiError } from "@/lib/errors";

// request validation
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
) {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.issues.map((e: any) => e.message).join(", ")}`
      );
    }
    throw new Error("Invalid JSON");
  }
}

// response helpers
export const apiResponse = {
  success: (data?: any, message?: string) => {
    return NextResponse.json({
      success: true,
      data,
      message,
    });
  },

  error: (message: string, status: number = 400) => {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  },

  notFound: (message: string = "Not found") => {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 404 }
    );
  },

  unauthorized: (message: string = "Unauthorized") => {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 401 }
    );
  },

  forbidden: (message: string = "Forbidden") => {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 403 }
    );
  },
};

// route wrapper for authenticated routes
export function withAuth(
  handler: (
    request: NextRequest,
    params: any,
    user: { id: string; email: string }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<Record<string, any>> }
  ) => {
    try {
      const { user } = await luciaValidateRequest();
      if (!user) {
        return apiResponse.unauthorized();
      }

      const resolvedParams = await params;
      return await handler(request, resolvedParams, {
        id: user.id,
        email: user.email,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// route wrapper for public routes
export function publicRoute(
  handler: (request: NextRequest, params: any) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<Record<string, any>> }
  ) => {
    try {
      const resolvedParams = await params;
      return await handler(request, resolvedParams);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
