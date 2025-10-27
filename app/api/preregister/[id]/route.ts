import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { estado, comentario } = body;

    if (!estado) {
      return NextResponse.json(
        { message: "El estado es requerido" },
        { status: 400 }
      );
    }

    const validStates = ["pendiente", "en_revision", "aprobado", "rechazado"];
    if (!validStates.includes(estado)) {
      return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
    }

    const supabase = createClient();

    // Obtener el preregistro actual para actualizar el historial
    const { data: currentPreregistration, error: fetchError } = await supabase
      .from("preregistrations")
      .select("historial_comentarios")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { message: "Preregistro no encontrado" },
        { status: 404 }
      );
    }

    // Crear nuevo comentario para el historial
    const newComment = {
      fecha: new Date().toISOString(),
      estado_anterior:
        currentPreregistration.historial_comentarios.length > 0
          ? currentPreregistration.historial_comentarios[
              currentPreregistration.historial_comentarios.length - 1
            ].estado_nuevo
          : "pendiente",
      estado_nuevo: estado,
      comentario: comentario || `Estado cambiado a ${estado}`,
      administrador: "Sistema", // TODO: Obtener del usuario autenticado
    };

    // Actualizar el preregistro
    const { data, error } = await supabase
      .from("preregistrations")
      .update({
        estado,
        historial_comentarios: [
          ...(currentPreregistration.historial_comentarios || []),
          newComment,
        ],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating preregistration:", error);
      return NextResponse.json(
        { message: "Error al actualizar el preregistro" },
        { status: 500 }
      );
    }

    // TODO: Enviar notificación por email al cliente
    // TODO: Si se aprueba, crear evento formal

    return NextResponse.json({
      message: "Estado actualizado exitosamente",
      preregistration: data,
    });
  } catch (error) {
    console.error("Error in preregistration update API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createClient();

    const { data: preregistration, error } = await supabase
      .from("preregistrations")
      .select(
        `
        *,
        administrador:users!preregistrations_id_administrador_asignado_fkey(name, email)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { message: "Preregistro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ preregistration });
  } catch (error) {
    console.error("Error in preregistration GET API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
