import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { validateSalaryEntry } from "@/lib/business-rules";
import { getCurrentOrganizationId } from "@/lib/utils/api-organization-filter";

/**
 * Endpoint para validar entrada de salario antes de crear
 * POST /api/validate/salaries
 * Body: { worker_id: string, month: number, year: number, hours_worked: number, hourly_rate: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { worker_id, month, year, hours_worked, hourly_rate } = body;

    // Validar parámetros requeridos
    if (!worker_id || month === undefined || year === undefined) {
      return NextResponse.json(
        {
          message: "worker_id, month y year son requeridos",
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Obtener organization_id del usuario autenticado
    const organizationId = await getCurrentOrganizationId(request, supabase);
    if (!organizationId) {
      return NextResponse.json(
        { message: "No se pudo determinar la organización del usuario" },
        { status: 401 }
      );
    }

    // Validar usando reglas de negocio
    const validation = await validateSalaryEntry(
      {
        worker_id,
        month,
        year,
        hours_worked: hours_worked || 0,
        hourly_rate: hourly_rate || 0,
      },
      supabase,
      organizationId
    );

    return NextResponse.json({
      isValid: validation.isValid,
      errors: validation.errors,
      message: validation.isValid
        ? "La entrada de salario es válida"
        : "La entrada de salario tiene errores",
    });
  } catch (error) {
    console.error("Error validating salary:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
