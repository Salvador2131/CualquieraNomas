/**
 * Reglas de Negocio: Sistema de Auditoría
 *
 * Este módulo contiene todas las funcionalidades relacionadas con:
 * - Registro de acciones
 * - Trazabilidad de cambios
 * - Logs de auditoría
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "LOGIN"
  | "LOGOUT";

export type EntityType =
  | "event"
  | "worker"
  | "employer"
  | "quote"
  | "payment"
  | "salary"
  | "preregistration"
  | "notification"
  | "user"
  | "conflict"
  | "penalty"
  | "rating"
  | "incident"
  | "certificate"
  | "subscription";

export interface AuditLog {
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string;
  user_id: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

/**
 * Registra un evento de auditoría
 */
export async function logAuditEvent(
  auditLog: AuditLog & { organization_id?: string },
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      action: auditLog.action,
      entity_type: auditLog.entity_type,
      entity_id: auditLog.entity_id,
      user_id: auditLog.user_id,
      changes: auditLog.changes || null,
      ip_address: auditLog.ip_address || null,
      user_agent: auditLog.user_agent || null,
      metadata: auditLog.metadata || null,
      organization_id: auditLog.organization_id || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // No lanzar error para no interrumpir el flujo principal
      // Solo loguear el error
      console.error("Error al registrar auditoría:", error);
    }
  } catch (error) {
    console.error("Error inesperado al registrar auditoría:", error);
  }
}

/**
 * Crea un log de auditoría para una acción CREATE
 */
export async function logCreate(
  entityType: EntityType,
  entityId: string,
  userId: string,
  newData: Record<string, any>,
  supabase: SupabaseClient,
  options?: {
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
    organization_id?: string;
  }
): Promise<void> {
  await logAuditEvent(
    {
      action: "CREATE",
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      changes: {
        before: null,
        after: newData,
      },
      ip_address: options?.ip_address,
      user_agent: options?.user_agent,
      metadata: options?.metadata,
      organization_id: options?.organization_id,
    },
    supabase
  );
}

/**
 * Crea un log de auditoría para una acción UPDATE
 */
export async function logUpdate(
  entityType: EntityType,
  entityId: string,
  userId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  supabase: SupabaseClient,
  options?: {
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
    organization_id?: string;
  }
): Promise<void> {
  // Solo registrar campos que cambiaron
  const changedFields: Record<string, any> = {};
  Object.keys(newData).forEach((key) => {
    if (oldData[key] !== newData[key]) {
      changedFields[key] = {
        before: oldData[key],
        after: newData[key],
      };
    }
  });

  // Si no hay cambios, no registrar
  if (Object.keys(changedFields).length === 0) {
    return;
  }

  await logAuditEvent(
    {
      action: "UPDATE",
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      changes: {
        before: oldData,
        after: newData,
      },
      ip_address: options?.ip_address,
      user_agent: options?.user_agent,
      metadata: {
        ...options?.metadata,
        changed_fields: Object.keys(changedFields),
      },
      organization_id: options?.organization_id,
    },
    supabase
  );
}

/**
 * Crea un log de auditoría para una acción DELETE
 */
export async function logDelete(
  entityType: EntityType,
  entityId: string,
  userId: string,
  deletedData: Record<string, any>,
  supabase: SupabaseClient,
  options?: {
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
    organization_id?: string;
  }
): Promise<void> {
  await logAuditEvent(
    {
      action: "DELETE",
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      changes: {
        before: deletedData,
        after: null,
      },
      ip_address: options?.ip_address,
      user_agent: options?.user_agent,
      metadata: options?.metadata,
      organization_id: options?.organization_id,
    },
    supabase
  );
}

/**
 * Crea un log de auditoría para una acción de login
 */
export async function logLogin(
  userId: string,
  email: string,
  supabase: SupabaseClient,
  options?: {
    ip_address?: string;
    user_agent?: string;
    success?: boolean;
    error?: string;
    organization_id?: string;
  }
): Promise<void> {
  await logAuditEvent(
    {
      action: options?.success === false ? "LOGIN" : "LOGIN",
      entity_type: "user",
      entity_id: userId,
      user_id: userId,
      metadata: {
        email,
        success: options?.success !== false,
        error: options?.error,
      },
      ip_address: options?.ip_address,
      user_agent: options?.user_agent,
      organization_id: options?.organization_id,
    },
    supabase
  );
}

/**
 * Crea un log de auditoría para una acción de logout
 */
export async function logLogout(
  userId: string,
  supabase: SupabaseClient,
  options?: {
    ip_address?: string;
    user_agent?: string;
    organization_id?: string;
  }
): Promise<void> {
  await logAuditEvent(
    {
      action: "LOGOUT",
      entity_type: "user",
      entity_id: userId,
      user_id: userId,
      ip_address: options?.ip_address,
      user_agent: options?.user_agent,
      organization_id: options?.organization_id,
    },
    supabase
  );
}

/**
 * Obtiene los logs de auditoría para una entidad
 */
export async function getAuditLogs(
  entityType: EntityType,
  entityId: string,
  supabase: SupabaseClient,
  options?: {
    limit?: number;
    offset?: number;
    organizationId?: string;
  }
) {
  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  // Aplicar filtro de organización si se proporciona
  if (options?.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    );
  }

  return await query;
}

/**
 * Obtiene los logs de auditoría para un usuario
 */
export async function getUserAuditLogs(
  userId: string,
  supabase: SupabaseClient,
  options?: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    organizationId?: string;
  }
) {
  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Aplicar filtro de organización si se proporciona
  if (options?.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }

  if (options?.action) {
    query = query.eq("action", options.action);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    );
  }

  return await query;
}
