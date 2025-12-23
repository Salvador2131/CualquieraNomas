import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { logLogin } from "@/lib/business-rules";

/**
 * API de Registro de Usuarios
 * POST /api/auth/register
 * Body: { email, password, name, role, phone?, company_name? (si es employer), specialization? (si es worker) }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      role,
      phone,
      company_name, // Para employers
      specialization, // Para workers
    } = body;

    // Validar campos requeridos
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { message: "email, password, name y role son requeridos" },
        { status: 400 }
      );
    }

    // Validar rol
    const validRoles = ["admin", "worker", "employer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { message: `Rol inválido. Roles válidos: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Validar campos específicos por rol
    if (role === "employer" && !company_name) {
      return NextResponse.json(
        { message: "company_name es requerido para empleadores" },
        { status: 400 }
      );
    }

    if (role === "worker" && !specialization) {
      return NextResponse.json(
        { message: "specialization es requerido para trabajadores" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { message: `Error al crear usuario: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: "Error al crear usuario" },
        { status: 500 }
      );
    }

    // 2. Obtener organización por defecto (para nuevos usuarios)
    // En producción, esto podría ser un proceso de aprobación
    const defaultOrganizationId = "00000000-0000-0000-0000-000000000001";

    // 3. Crear registro en tabla users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        name,
        role,
        phone: phone || null,
        organization_id: defaultOrganizationId,
      })
      .select()
      .single();

    if (userError) {
      // Si falla, loguear el error (en producción se podría eliminar el usuario de auth)
      console.error("Error creating user profile:", userError);
      return NextResponse.json(
        { message: `Error al crear perfil: ${userError.message}` },
        { status: 500 }
      );
    }

    // 4. Crear perfil específico según el rol
    if (role === "worker" && specialization) {
      const { error: workerError } = await supabase.from("workers").insert({
        user_id: authData.user.id,
        specialization,
        organization_id: defaultOrganizationId,
      });

      if (workerError) {
        console.error("Error creating worker profile:", workerError);
        // No fallar el registro, pero loguear el error
      }
    }

    if (role === "employer" && company_name) {
      const { error: employerError } = await supabase.from("employers").insert({
        user_id: authData.user.id,
        company_name,
        company_type: body.company_type || null,
        website: body.website || null,
        organization_id: defaultOrganizationId,
      });

      if (employerError) {
        console.error("Error creating employer profile:", employerError);
        // No fallar el registro, pero loguear el error
      }
    }

    // 5. Registrar auditoría de registro
    try {
      const ipAddress =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";

      await logLogin(authData.user.id, email, supabase, {
        success: true,
        ip_address: ipAddress,
        user_agent: userAgent,
        organization_id: defaultOrganizationId,
      });
    } catch (auditError) {
      console.error("Error logging registration audit:", auditError);
    }

    // 6. Crear respuesta con sesión
    const response = NextResponse.json({
      message: "Registro exitoso",
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        organization_id: userData.organization_id,
      },
    });

    // Establecer cookie de sesión
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
    console.error("Error en registro:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
