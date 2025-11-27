/**
 * Script para crear usuario administrador en la tabla users
 * Ejecutar: node scripts/create-admin-user.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Faltan variables de entorno");
  console.error(
    "Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
  process.exit(1);
}

// Crear cliente con service role key para tener permisos completos
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  console.log("🔍 Buscando usuario admin@ejemplo.com en auth.users...");

  try {
    // Buscar el usuario en auth.users usando la API de administración
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error al buscar usuarios:", authError);
      return;
    }

    const adminUser = authUsers.users.find(
      (user) => user.email === "admin@ejemplo.com"
    );

    if (!adminUser) {
      console.error("❌ Usuario admin@ejemplo.com no encontrado en auth.users");
      console.error(
        "⚠️  Por favor crea el usuario primero desde el Dashboard de Supabase:"
      );
      console.error("   1. Ve a Authentication > Users");
      console.error('   2. Click en "Add User"');
      console.error("   3. Email: admin@ejemplo.com");
      console.error("   4. Password: admin123");
      console.error("   5. Auto Confirm User: ✅");
      return;
    }

    console.log("✅ Usuario encontrado en auth.users:", adminUser.id);

    // Crear o actualizar el registro en la tabla users
    console.log("📝 Creando/actualizando registro en tabla users...");

    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          id: adminUser.id,
          email: "admin@ejemplo.com",
          name: "Administrador",
          role: "admin",
        },
        {
          onConflict: "email",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ Error al crear/actualizar usuario:", error);
      console.error(
        "💡 Intenta ejecutar el SQL manualmente en Supabase SQL Editor:"
      );
      console.error(`
INSERT INTO users (id, email, name, role)
VALUES ('${adminUser.id}', 'admin@ejemplo.com', 'Administrador', 'admin')
ON CONFLICT (email) DO UPDATE
SET role = 'admin', name = 'Administrador', updated_at = NOW();
      `);
      return;
    }

    console.log("✅ Usuario administrador creado/actualizado exitosamente!");
    console.log("📋 Datos:", data);
    console.log("");
    console.log("🎉 ¡Listo! Ahora puedes iniciar sesión con:");
    console.log("   Email: admin@ejemplo.com");
    console.log("   Contraseña: admin123");
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
}

createAdminUser();




