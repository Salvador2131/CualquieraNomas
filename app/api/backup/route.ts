import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const supabase = createClient();

    let query = supabase
      .from("backups")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: backups, error } = await query;

    if (error) {
      console.error("Error fetching backups:", error);
      return NextResponse.json(
        { message: "Error al obtener backups" },
        { status: 500 }
      );
    }

    // Obtener total de registros para paginación
    const { count } = await supabase
      .from("backups")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      backups,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in backup GET API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backup_type, notes } = body;

    const supabase = createClient();

    // Crear backup usando la función de la base de datos
    const { data, error } = await supabase.rpc("create_full_backup");

    if (error) {
      console.error("Error creating backup:", error);
      return NextResponse.json(
        { message: "Error al crear backup" },
        { status: 500 }
      );
    }

    // Obtener detalles del backup creado
    const { data: backup, error: fetchError } = await supabase
      .from("backups")
      .select("*")
      .eq("id", data)
      .single();

    if (fetchError) {
      console.error("Error fetching created backup:", fetchError);
      return NextResponse.json(
        { message: "Backup creado pero error al obtener detalles" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Backup creado exitosamente",
      backup,
    });
  } catch (error) {
    console.error("Error in backup POST API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { backup_id } = body;

    if (!backup_id) {
      return NextResponse.json(
        { message: "backup_id es requerido" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Restaurar backup usando la función de la base de datos
    const { data, error } = await supabase.rpc("restore_backup", {
      p_backup_id: backup_id,
    });

    if (error) {
      console.error("Error restoring backup:", error);
      return NextResponse.json(
        { message: "Error al restaurar backup" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Backup restaurado exitosamente",
      success: data,
    });
  } catch (error) {
    console.error("Error in backup restore API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backup_id = searchParams.get("backup_id");

    if (!backup_id) {
      return NextResponse.json(
        { message: "backup_id es requerido" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Eliminar backup
    const { error } = await supabase
      .from("backups")
      .delete()
      .eq("id", backup_id);

    if (error) {
      console.error("Error deleting backup:", error);
      return NextResponse.json(
        { message: "Error al eliminar backup" },
        { status: 500 }
      );
    }

    // Crear log de eliminación
    await supabase.from("backup_logs").insert({
      backup_id,
      action: "deleted",
      details: {
        deleted_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      message: "Backup eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error in backup DELETE API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
