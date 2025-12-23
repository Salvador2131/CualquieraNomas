import { NextRequest } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Obtiene el organization_id del usuario autenticado desde la cookie de sesión
 * @param request - NextRequest con cookies
 * @returns organization_id o null
 */
export async function getOrganizationIdFromSession(
  request: NextRequest
): Promise<string | null> {
  try {
    const userSession = request.cookies.get("user-session");

    if (!userSession) {
      return null;
    }

    const sessionData = JSON.parse(userSession.value);
    return sessionData.organizationId || null;
  } catch (error) {
    console.error("Error parsing session cookie:", error);
    return null;
  }
}

/**
 * Obtiene el organization_id del usuario desde la base de datos usando su userId
 * @param supabase - Cliente de Supabase
 * @param userId - ID del usuario
 * @returns organization_id o null
 */
export async function getOrganizationIdFromUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  try {
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
    console.error("Error in getOrganizationIdFromUser:", error);
    return null;
  }
}

/**
 * Obtiene el organization_id del usuario autenticado (intenta desde cookie primero, luego desde BD)
 * @param request - NextRequest
 * @param supabase - Cliente de Supabase
 * @param userId - ID del usuario (opcional, se obtiene de la cookie si no se proporciona)
 * @returns organization_id o null
 */
export async function getCurrentOrganizationId(
  request: NextRequest,
  supabase: SupabaseClient,
  userId?: string
): Promise<string | null> {
  // Intentar desde la cookie primero
  const orgIdFromCookie = await getOrganizationIdFromSession(request);
  if (orgIdFromCookie) {
    return orgIdFromCookie;
  }

  // Si no hay en cookie y tenemos userId, obtener desde BD
  if (userId) {
    return await getOrganizationIdFromUser(supabase, userId);
  }

  // Intentar obtener userId de la cookie
  try {
    const userSession = request.cookies.get("user-session");
    if (userSession) {
      const sessionData = JSON.parse(userSession.value);
      if (sessionData.userId) {
        return await getOrganizationIdFromUser(supabase, sessionData.userId);
      }
    }
  } catch (error) {
    console.error("Error getting userId from session:", error);
  }

  return null;
}

/**
 * Agrega el filtro de organization_id a una query de Supabase
 * @param query - Query de Supabase
 * @param organizationId - ID de la organización
 * @returns Query con el filtro aplicado
 */
export function addOrganizationFilter<T>(
  query: any,
  organizationId: string | null
): any {
  if (!organizationId) {
    return query;
  }

  return query.eq("organization_id", organizationId);
}

/**
 * Valida que el organization_id proporcionado pertenezca al usuario
 * @param supabase - Cliente de Supabase
 * @param userId - ID del usuario
 * @param organizationId - ID de la organización a validar
 * @returns true si la organización pertenece al usuario
 */
export async function validateUserOrganization(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
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

/**
 * Obtiene el userId del usuario autenticado desde la cookie de sesión
 * @param request - NextRequest con cookies
 * @returns userId o null
 */
export async function getUserIdFromSession(
  request: NextRequest
): Promise<string | null> {
  try {
    const userSession = request.cookies.get("user-session");

    if (!userSession) {
      return null;
    }

    const sessionData = JSON.parse(userSession.value);
    return sessionData.userId || sessionData.id || null;
  } catch (error) {
    console.error("Error parsing session cookie for userId:", error);
    return null;
  }
}

/**
 * Obtiene userId y organizationId del usuario autenticado
 * @param request - NextRequest
 * @param supabase - Cliente de Supabase
 * @returns Objeto con userId y organizationId, o null si no se puede obtener
 */
export async function getCurrentUserInfo(
  request: NextRequest,
  supabase: SupabaseClient
): Promise<{ userId: string; organizationId: string } | null> {
  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return null;
    }

    const organizationId = await getCurrentOrganizationId(
      request,
      supabase,
      userId
    );
    if (!organizationId) {
      return null;
    }

    return { userId, organizationId };
  } catch (error) {
    console.error("Error getting current user info:", error);
    return null;
  }
}
