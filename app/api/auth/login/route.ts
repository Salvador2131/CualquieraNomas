import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Intentar autenticación con Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 401 }
      );
    }

    // Obtener información del usuario desde la tabla users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, role, name")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { message: "Error al obtener información del usuario" },
        { status: 500 }
      );
    }

    // Crear sesión (en un entorno real, usarías cookies seguras)
    const response = NextResponse.json({
      message: "Login exitoso",
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
    });

    // Establecer cookie de sesión (opcional, para mantener la sesión)
    response.cookies.set(
      "user-session",
      JSON.stringify({
        userId: userData.id,
        role: userData.role,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 días
      }
    );

    return response;
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
