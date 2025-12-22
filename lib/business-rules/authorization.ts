/**
 * Reglas de Negocio: Control de Acceso y Autorización
 *
 * Este módulo contiene todas las validaciones relacionadas con:
 * - Control de acceso por rol
 * - Permisos por entidad
 * - Validación de autorización
 */

export interface AuthorizationResult {
  authorized: boolean;
  error?: string;
}

/**
 * Roles del sistema
 */
export type UserRole = "admin" | "worker" | "employer";

/**
 * Acciones disponibles en el sistema
 */
export type Action = "view" | "create" | "update" | "delete";

/**
 * Entidades del sistema
 */
export type Entity =
  | "workers"
  | "events"
  | "quotes"
  | "employers"
  | "preregistrations"
  | "payments"
  | "salaries"
  | "notifications"
  | "settings";

/**
 * Reglas de acceso por entidad y acción
 */
const ENTITY_ACCESS_RULES: Record<
  Entity,
  Partial<Record<Action, UserRole[]>>
> = {
  workers: {
    view: ["admin", "worker"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
  events: {
    view: ["admin", "worker"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
  quotes: {
    view: ["admin"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
  employers: {
    view: ["admin"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
  preregistrations: {
    view: ["admin"],
    create: ["admin"], // También público (sin autenticación)
    update: ["admin"],
    delete: ["admin"],
  },
  payments: {
    view: ["admin"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
  salaries: {
    view: ["admin", "worker"], // Workers solo pueden ver sus propios salarios
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
  notifications: {
    view: ["admin", "worker"],
    create: ["admin"], // Sistema también puede crear
    update: ["admin", "worker"], // Workers pueden marcar como leídas
    delete: ["admin"],
  },
  settings: {
    view: ["admin"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
};

/**
 * Verifica si un rol tiene acceso a una acción en una entidad
 */
export function canAccessEntity(
  entity: Entity,
  action: Action,
  userRole: UserRole
): boolean {
  const rules = ENTITY_ACCESS_RULES[entity];
  if (!rules) return false;

  const allowedRoles = rules[action];
  if (!allowedRoles) return false;

  return allowedRoles.includes(userRole);
}

/**
 * Valida el acceso a una entidad y acción específica
 */
export function requireRole(
  allowedRoles: UserRole[],
  userRole: UserRole
): AuthorizationResult {
  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      error: `Acceso denegado. Roles permitidos: ${allowedRoles.join(
        ", "
      )}. Tu rol: ${userRole}`,
    };
  }
  return { authorized: true };
}

/**
 * Valida el acceso a una acción en una entidad
 */
export function requireEntityAccess(
  entity: Entity,
  action: Action,
  userRole: UserRole
): AuthorizationResult {
  const authorized = canAccessEntity(entity, action, userRole);

  if (!authorized) {
    const rules = ENTITY_ACCESS_RULES[entity];
    const allowedRoles = rules?.[action] || [];
    return {
      authorized: false,
      error: `No tienes permiso para ${action} en ${entity}. Roles permitidos: ${allowedRoles.join(
        ", "
      )}. Tu rol: ${userRole}`,
    };
  }

  return { authorized: true };
}

/**
 * Verifica si un usuario puede acceder a sus propios datos
 * (para casos especiales como workers viendo sus propios salarios)
 */
export function canAccessOwnData(
  entity: Entity,
  action: Action,
  userRole: UserRole,
  userId: string,
  resourceUserId?: string
): boolean {
  // Si el recurso pertenece al usuario, puede acceder
  if (resourceUserId && userId === resourceUserId) {
    // Verificar reglas especiales para acceso a datos propios
    if (entity === "salaries" && action === "view" && userRole === "worker") {
      return true;
    }
    if (
      entity === "notifications" &&
      action === "update" &&
      userRole === "worker"
    ) {
      return true;
    }
  }

  // Si no es su propio recurso, usar las reglas normales
  return canAccessEntity(entity, action, userRole);
}

/**
 * Valida acceso a datos propios
 */
export function requireOwnDataAccess(
  entity: Entity,
  action: Action,
  userRole: UserRole,
  userId: string,
  resourceUserId?: string
): AuthorizationResult {
  const authorized = canAccessOwnData(
    entity,
    action,
    userRole,
    userId,
    resourceUserId
  );

  if (!authorized) {
    if (resourceUserId && userId !== resourceUserId) {
      return {
        authorized: false,
        error: `No tienes permiso para acceder a este recurso. Solo puedes acceder a tus propios datos.`,
      };
    }
    return requireEntityAccess(entity, action, userRole);
  }

  return { authorized: true };
}

/**
 * Verifica si un rol es administrador
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === "admin";
}

/**
 * Verifica si un rol es trabajador
 */
export function isWorker(userRole: UserRole): boolean {
  return userRole === "worker";
}

/**
 * Verifica si un rol es empleador
 */
export function isEmployer(userRole: UserRole): boolean {
  return userRole === "employer";
}

/**
 * Obtiene todos los roles permitidos para una entidad y acción
 */
export function getAllowedRoles(entity: Entity, action: Action): UserRole[] {
  const rules = ENTITY_ACCESS_RULES[entity];
  return rules?.[action] || [];
}
