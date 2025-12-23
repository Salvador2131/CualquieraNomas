import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config/env";
import { createClient } from "@/lib/supabase";
import { expireOldQuotes } from "@/lib/business-rules";

/**
 * Endpoint para cron job que expira cotizaciones automáticamente
 * POST /api/cron/expire-quotes
 *
 * Este endpoint puede ser llamado por:
 * - Vercel Cron Jobs
 * - GitHub Actions
 * - Servicios externos de cron
 *
 * Para usar con Vercel, agregar a vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-quotes",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que la request viene de un servicio autorizado
    // (opcional: agregar verificación de secret/token)
    const authHeader = request.headers.get("authorization");
    const cronSecret = env.cron.secret;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const supabase = createClient();

    // Expirar cotizaciones para todas las organizaciones
    // Si necesitas filtrar por organización, puedes obtener organizationId del request
    const result = await expireOldQuotes(supabase);

    return NextResponse.json({
      success: errors.length === 0,
      expiredCount: totalExpired,
      errors,
      organizationsProcessed: organizations?.length || 0,
      message: `Se expiraron ${totalExpired} cotización(es) en ${
        organizations?.length || 0
      } organización(es)`,
    });
  } catch (error) {
    console.error("Error expiring quotes:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al expirar cotizaciones",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * También permitir GET para facilitar testing
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
