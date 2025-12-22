import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Error en sistema" },
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
        { message: "Error en sistema" },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: "Error en sistema" },
        { status: 401 }
      );
    }

    // Obtener información del usuario desde la tabla users (incluyendo organization_id)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, role, name, organization_id")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { message: "Error en sistema" },
        { status: 500 }
      );
    }

    // Obtener información de la organización
    let organizationData = null;
    if (userData.organization_id) {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name, slug, plan, status")
        .eq("id", userData.organization_id)
        .single();
      
      organizationData = orgData;
    }

    // Crear sesión (en un entorno real, usarías cookies seguras)
    const response = NextResponse.json({
      message: "Login exitoso",
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        organization_id: userData.organization_id,
        organization: organizationData,
      },
    });

    // Establecer cookie de sesión (incluyendo organization_id)
    response.cookies.set(
      "user-session",
      JSON.stringify({
        userId: userData.id,
        role: userData.role,
        organizationId: userData.organization_id,
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
    return NextResponse.json({ message: "Error en sistema" }, { status: 500 });
  }
}
