import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Cerrar sesión en Supabase
    await supabase.auth.signOut();

    // Crear respuesta y eliminar cookie de sesión
    const response = NextResponse.json(
      { message: "Sesión cerrada exitosamente" },
      { status: 200 }
    );

    // Eliminar cookie de sesión
    response.cookies.delete("user-session");
    response.cookies.set("user-session", "", {
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error en logout:", error);
    return NextResponse.json(
      { message: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}




