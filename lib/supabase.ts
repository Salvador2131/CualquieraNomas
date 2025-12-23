import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env, isEnvValid, getEnvErrors } from "@/lib/config/env";

// Función para obtener variables de entorno de forma segura
function getSupabaseConfig() {
  if (!isEnvValid()) {
    const errors = getEnvErrors();
    throw new Error(
      `Configuración de Supabase inválida: ${errors.join(", ")}`
    );
  }

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = env.supabase;

  return { supabaseUrl, supabaseAnonKey };
}

// Función principal para crear cliente de Supabase
export const createClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};

// Cliente singleton para uso en componentes del cliente
export const supabase = createClient();

// Cliente para operaciones del servidor con service role key
export const createServerClient = () => {
  const { url: supabaseUrl } = env.supabase;
  const serviceRoleKey = env.supabase.serviceRoleKey;

  if (!serviceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not found, using anon key");
    return createClient();
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
