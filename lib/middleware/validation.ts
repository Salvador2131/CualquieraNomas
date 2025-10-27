import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

export function createValidationMiddleware(options: ValidationOptions) {
  return async (request: NextRequest) => {
    const errors: string[] = [];

    try {
      // Validar body si existe
      if (options.body && request.method !== "GET") {
        const body = await request.json();
        const result = options.body.safeParse(body);
        if (!result.success) {
          errors.push(
            `Body validation failed: ${result.error.errors
              .map((e) => e.message)
              .join(", ")}`
          );
        }
      }

      // Validar query parameters
      if (options.query) {
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        const result = options.query.safeParse(queryParams);
        if (!result.success) {
          errors.push(
            `Query validation failed: ${result.error.errors
              .map((e) => e.message)
              .join(", ")}`
          );
        }
      }

      // Validar params si existe
      if (options.params) {
        // Los params se validan en el handler específico
        // ya que Next.js no los expone en el middleware
      }

      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: errors,
          },
          { status: 400 }
        );
      }

      return null; // No hay errores, continuar
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: ["Request body must be valid JSON"],
        },
        { status: 400 }
      );
    }
  };
}

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; error: string; details: any[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: "Validation failed",
    details: result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    })),
  };
}

export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status }
  );
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

