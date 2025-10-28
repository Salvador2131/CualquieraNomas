import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Verificar variables de entorno
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: !!process.env.JWT_SECRET,
      encryptionKey: !!process.env.ENCRYPTION_KEY,
    };

    return NextResponse.json({
      status: "success",
      message: "Test endpoint working",
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
      },
      environmentVariables: envCheck,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Test endpoint failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
