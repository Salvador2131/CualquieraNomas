/**
 * Índice de Reglas de Negocio
 *
 * Exporta todas las funciones de reglas de negocio para facilitar las importaciones
 */

// Financial
export {
  validateQuoteCalculation,
  validatePayment,
  calculateQuoteValues,
  type QuoteInput,
  type PaymentInput,
  type ValidationResult,
} from "./financial";

// Assignments
export {
  validateWorkerAvailability,
  validateEventCapacity,
  validateMultipleWorkers,
  validateWorkerSpecialization,
  type Conflict,
  type AvailabilityCheck,
} from "./assignments";

// Events
export {
  validateEventDates,
  validateEventStateTransition,
  validateEventDataForState,
  validateGuestCount,
  validateEventBudget,
  type EventDateInput,
  type EventStateTransition,
} from "./events";

// Salaries
export {
  validateSalaryEntry,
  calculateSalary,
  validateSalaryDateRange,
  type SalaryInput,
} from "./salaries";

// Quotes
export {
  validateQuoteExpiration,
  expireOldQuotes,
  isQuoteExpired,
  getDaysUntilExpiration,
  getQuoteStatusWithExpiration,
  canAcceptQuote,
  canRejectQuote,
} from "./quotes";

// Conflicts
export {
  detectScheduleConflicts,
  hasTimeOverlap,
  calculateOverlapDuration,
  detectWorkerConflict,
  canAutoResolveConflict,
  getEventConflictsSummary,
  type ScheduleConflict,
} from "./conflicts";

// Audit
export {
  logAuditEvent,
  logCreate,
  logUpdate,
  logDelete,
  logLogin,
  logLogout,
  getAuditLogs,
  getUserAuditLogs,
  type AuditAction,
  type EntityType,
  type AuditLog,
} from "./audit";

// Authorization
export {
  canAccessEntity,
  requireRole,
  requireEntityAccess,
  canAccessOwnData,
  requireOwnDataAccess,
  isAdmin,
  isWorker,
  isEmployer,
  getAllowedRoles,
  type UserRole,
  type Action,
  type Entity,
  type AuthorizationResult,
} from "./authorization";

// Transactions
export {
  createEventWithAssignments,
  updateEventWithStateValidation,
  rollbackTransaction,
  type CreateEventWithAssignmentsInput,
  type TransactionResult,
} from "./transactions";
