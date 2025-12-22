import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * Obtiene el organization_id del usuario autenticado desde el servidor
 * @param userId - ID del usuario autenticado
 * @returns organization_id o null si no se encuentra
 */
export async function getUserOrganizationId(userId: string): Promise<string | null> {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("Error fetching user organization:", error);
      return null;
    }

    return data.organization_id;
  } catch (error) {
    console.error("Error in getUserOrganizationId:", error);
    return null;
  }
}

/**
 * Obtiene el organization_id desde la sesión del usuario (para API routes)
 * @param request - NextRequest con cookies
 * @returns organization_id o null
 */
export async function getOrganizationIdFromRequest(request: Request): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user-session");

    if (!userSession) {
      return null;
    }

    const sessionData = JSON.parse(userSession.value);
    const userId = sessionData.userId;

    if (!userId) {
      return null;
    }

    return await getUserOrganizationId(userId);
  } catch (error) {
    console.error("Error in getOrganizationIdFromRequest:", error);
    return null;
  }
}

/**
 * Valida que el organization_id proporcionado pertenezca al usuario
 * @param userId - ID del usuario
 * @param organizationId - ID de la organización a validar
 * @returns true si la organización pertenece al usuario
 */
export async function validateUserOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.organization_id === organizationId;
  } catch (error) {
    console.error("Error in validateUserOrganization:", error);
    return false;
  }
}
