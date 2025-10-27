import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Validar variables de entorno con formato
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Validar formato de URL
if (!supabaseUrl.startsWith("https://") && !supabaseUrl.startsWith("http://")) {
  throw new Error("Invalid Supabase URL format");
}

// Validar que la clave anon no sea el placeholder
if (
  supabaseAnonKey.includes("tu-") ||
  supabaseAnonKey.includes("your-") ||
  supabaseAnonKey.length < 20
) {
  console.warn("Supabase anon key appears to be invalid or placeholder");
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Función helper para crear cliente de Supabase
export const createClient = () => {
  return supabase;
};

// Cliente para operaciones del servidor con service role key
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not found, using anon key");
    return supabase;
  }

  // Validar service role key no sea placeholder
  if (
    serviceRoleKey.includes("tu-") ||
    serviceRoleKey.includes("your-") ||
    serviceRoleKey.length < 20
  ) {
    console.warn(
      "Supabase service role key appears to be invalid or placeholder"
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
