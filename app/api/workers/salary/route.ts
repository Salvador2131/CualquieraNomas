import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { apiLogger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // Validar parámetros de paginación - prevenir NaN, negativos y límites excesivos
    const pageParam = parseInt(searchParams.get("page") || "1");
    const limitParam = parseInt(searchParams.get("limit") || "10");

    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
    const limit = Math.min(
      100,
      Math.max(1, isNaN(limitParam) ? 10 : limitParam)
    );
    const offset = (page - 1) * limit;

    const supabase = createClient();

    let query = supabase
      .from("worker_salaries")
      .select(
        `
        *,
        workers:worker_id (
          id,
          name,
          role,
          hourly_rate
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (workerId) {
      query = query.eq("worker_id", workerId);
    }

    if (month) {
      query = query.eq("month", parseInt(month));
    }

    if (year) {
      query = query.eq("year", parseInt(year));
    }

    const { data: salaries, error } = await query;

    if (error) {
      apiLogger.error("Error fetching salaries", {
        error,
        workerId,
        month,
        year,
      });
      return NextResponse.json(
        { message: "Error al obtener salarios" },
        { status: 500 }
      );
    }

    // Obtener total de registros para paginación - APLICAR MISMOS FILTROS
    let countQuery = supabase
      .from("worker_salaries")
      .select("*", { count: "exact", head: true });

    if (workerId) {
      countQuery = countQuery.eq("worker_id", workerId);
    }

    if (month) {
      countQuery = countQuery.eq("month", parseInt(month));
    }

    if (year) {
      countQuery = countQuery.eq("year", parseInt(year));
    }

    const { count } = await countQuery;

    return NextResponse.json({
      salaries,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    apiLogger.error("Error in salaries GET API", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      worker_id,
      month,
      year,
      hours_worked,
      hourly_rate,
      base_salary,
      overtime_hours,
      overtime_rate,
      bonuses,
      deductions,
      total_salary,
      status,
      notes,
    } = body;

    // Validar campos requeridos
    if (!worker_id || !month || !year) {
      return NextResponse.json(
        { message: "worker_id, month y year son requeridos" },
        { status: 400 }
      );
    }

    // Validar inputs numéricos - no permitir negativos
    if (
      hours_worked !== undefined &&
      (hours_worked < 0 || hours_worked > 400)
    ) {
      return NextResponse.json(
        { message: "Las horas trabajadas deben estar entre 0 y 400" },
        { status: 400 }
      );
    }

    if (
      overtime_hours !== undefined &&
      (overtime_hours < 0 || overtime_hours > 100)
    ) {
      return NextResponse.json(
        { message: "Las horas extra deben estar entre 0 y 100" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verificar si ya existe un salario para este trabajador en este mes y año
    const { data: existingSalary } = await supabase
      .from("worker_salaries")
      .select("id")
      .eq("worker_id", worker_id)
      .eq("month", month)
      .eq("year", year)
      .single();

    if (existingSalary) {
      apiLogger.warn("Duplicate salary attempt", {
        worker_id,
        month,
        year,
        existing_id: existingSalary.id,
      });
      return NextResponse.json(
        {
          message:
            "Ya existe un salario para este trabajador en este mes y año",
          existing_salary: existingSalary,
        },
        { status: 409 } // 409 Conflict
      );
    }

    const { data, error } = await supabase
      .from("worker_salaries")
      .insert({
        worker_id,
        month,
        year,
        hours_worked: hours_worked || 0,
        hourly_rate: hourly_rate || 0,
        base_salary: base_salary || 0,
        overtime_hours: overtime_hours || 0,
        overtime_rate: overtime_rate || 0,
        bonuses: bonuses || 0,
        deductions: deductions || 0,
        total_salary: total_salary || 0,
        status: status || "pending",
        notes,
      })
      .select(
        `
        *,
        workers:worker_id (
          id,
          name,
          role,
          hourly_rate
        )
      `
      )
      .single();

    if (error) {
      apiLogger.error("Error creating salary", {
        error,
        worker_id,
        month,
        year,
      });
      return NextResponse.json(
        { message: "Error al crear salario" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Salario creado exitosamente",
      salary: data,
    });
  } catch (error) {
    apiLogger.error("Error in salaries POST API", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ message: "id es requerido" }, { status: 400 });
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("worker_salaries")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        workers:worker_id (
          id,
          name,
          role,
          hourly_rate
        )
      `
      )
      .single();

    if (error) {
      apiLogger.error("Error updating salary", { error, id });
      return NextResponse.json(
        { message: "Error al actualizar salario" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Salario actualizado exitosamente",
      salary: data,
    });
  } catch (error) {
    apiLogger.error("Error in salaries PATCH API", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para calcular salario automáticamente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { worker_id, month, year, hours_worked, overtime_hours } = body;

    if (!worker_id || !month || !year) {
      return NextResponse.json(
        { message: "worker_id, month y year son requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Obtener información del trabajador
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("hourly_rate")
      .eq("id", worker_id)
      .single();

    if (workerError || !worker) {
      return NextResponse.json(
        { message: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Calcular salario
    const hourlyRate = worker.hourly_rate || 0;
    const regularHours = hours_worked || 0;
    const overtime = overtime_hours || 0;
    const overtimeRate = hourlyRate * 1.5; // 1.5x para horas extra

    const baseSalary = regularHours * hourlyRate;
    const overtimePay = overtime * overtimeRate;
    const totalSalary = baseSalary + overtimePay;

    return NextResponse.json({
      message: "Salario calculado exitosamente",
      calculation: {
        hourly_rate: hourlyRate,
        regular_hours: regularHours,
        overtime_hours: overtime,
        base_salary: baseSalary,
        overtime_pay: overtimePay,
        total_salary: totalSalary,
      },
    });
  } catch (error) {
    apiLogger.error("Error in salary calculation API", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
