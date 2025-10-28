import { createClient } from "@/lib/supabase";

export async function GET() {
  try {
    // Crear cliente de Supabase
    const supabase = createClient();

    // Verificar conexión básica
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      return Response.json(
        {
          status: "error",
          message: "Error connecting to Supabase",
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    // Verificar variables de entorno
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: !!process.env.JWT_SECRET,
      encryptionKey: !!process.env.ENCRYPTION_KEY,
    };

    // Verificar formato de URL
    const urlFormat =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://");

    return Response.json({
      status: "success",
      message: "Supabase connection successful",
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        urlFormatValid: urlFormat,
        anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      },
      environmentVariables: envCheck,
      connection: {
        data: data,
        error: null,
      },
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: "Failed to initialize Supabase client",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
