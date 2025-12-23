import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getCurrentUserInfo } from "@/lib/utils/api-organization-filter";
import { logLogout } from "@/lib/business-rules";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Obtener userId antes de cerrar sesión para auditoría
    const userInfo = await getCurrentUserInfo(request, supabase);

    // Cerrar sesión en Supabase
    await supabase.auth.signOut();

    // Registrar auditoría de logout
    if (userInfo) {
      try {
        const ipAddress =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        await logLogout(userInfo.userId, supabase, {
          ip_address: ipAddress,
          user_agent: userAgent,
          organization_id: userInfo.organizationId,
        });
      } catch (auditError) {
        // No fallar el logout por error de auditoría
        console.error("Error logging logout audit:", auditError);
      }
    }

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
