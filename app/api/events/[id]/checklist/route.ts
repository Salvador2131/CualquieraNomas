import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createClient();

    const { data: event, error } = await supabase
      .from("events")
      .select("id, titulo, checklist")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ checklist: event.checklist });
  } catch (error) {
    console.error("Error in checklist GET API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { categoria, campo, valor } = body;

    if (!categoria || !campo || valor === undefined) {
      return NextResponse.json(
        { message: "Categoría, campo y valor son requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Obtener el checklist actual
    const { data: currentEvent, error: fetchError } = await supabase
      .from("events")
      .select("checklist")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { message: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el checklist
    const updatedChecklist = { ...currentEvent.checklist };

    if (!updatedChecklist[categoria]) {
      updatedChecklist[categoria] = {};
    }

    updatedChecklist[categoria][campo] = valor;

    // Verificar si la categoría está completa
    const categoriaData = updatedChecklist[categoria];
    const camposRequeridos = getRequiredFields(categoria);
    const camposCompletados = camposRequeridos.filter((campo) => {
      const valor = categoriaData[campo];
      if (Array.isArray(valor)) {
        return valor.length > 0;
      }
      return valor !== false && valor !== 0 && valor !== "";
    });

    updatedChecklist[categoria].completado =
      camposCompletados.length === camposRequeridos.length;

    // Actualizar en la base de datos
    const { data, error } = await supabase
      .from("events")
      .update({
        checklist: updatedChecklist,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating checklist:", error);
      return NextResponse.json(
        { message: "Error al actualizar el checklist" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Checklist actualizado exitosamente",
      checklist: updatedChecklist,
    });
  } catch (error) {
    console.error("Error in checklist PATCH API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

function getRequiredFields(categoria: string): string[] {
  const requiredFields: { [key: string]: string[] } = {
    recursos_humanos: [
      "garzones_requeridos",
      "garzones_asignados",
      "bartenders_requeridos",
      "bartenders_asignados",
      "personal_cocina_requerido",
      "personal_cocina_asignado",
      "supervisores_requeridos",
      "supervisores_asignados",
    ],
    equipamiento_mobiliario: [
      "mesas_sillas_requeridas",
      "mesas_sillas_asignadas",
      "manteleria_vajilla_requerida",
      "manteleria_vajilla_asignada",
    ],
    alimentacion_bebidas: ["menu_aprobado", "lista_bebidas_aprobada"],
    aspectos_logisticos: [
      "transporte_equipos",
      "horarios_montaje",
      "horarios_desmontaje",
    ],
  };

  return requiredFields[categoria] || [];
}
