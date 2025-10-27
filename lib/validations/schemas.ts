import { z } from "zod";

// ========================================
// SCHEMAS DE USUARIOS
// ========================================

export const userSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "worker", "client"], {
    errorMap: () => ({ message: "El rol debe ser admin, worker o client" }),
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const userUpdateSchema = userSchema.partial();

export const userLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// ========================================
// SCHEMAS DE PREREGISTROS
// ========================================

export const preregistrationSchema = z.object({
  client_name: z.string().min(1, "El nombre del cliente es requerido").max(100),
  client_email: z.string().email("Email del cliente inválido"),
  client_phone: z.string().min(1, "El teléfono del cliente es requerido"),
  event_type: z.string().min(1, "El tipo de evento es requerido"),
  event_date: z.string().datetime("Fecha de evento inválida"),
  guest_count: z
    .number()
    .int()
    .min(1, "Debe haber al menos 1 invitado")
    .max(10000),
  budget: z.number().min(0, "El presupuesto no puede ser negativo").optional(),
  location: z.string().min(1, "La ubicación es requerida"),
  special_requirements: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

export const preregistrationUpdateSchema = preregistrationSchema.partial();

// ========================================
// SCHEMAS DE EVENTOS
// ========================================

export const eventSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(200),
  descripcion: z.string().optional(),
  fecha_evento: z.string().datetime("Fecha de evento inválida"),
  hora_inicio: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  hora_fin: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  ubicacion: z.string().min(1, "La ubicación es requerida"),
  tipo_evento: z.string().min(1, "El tipo de evento es requerido"),
  numero_invitados: z
    .number()
    .int()
    .min(1, "Debe haber al menos 1 invitado")
    .max(10000),
  presupuesto: z
    .number()
    .min(0, "El presupuesto no puede ser negativo")
    .optional(),
  estado: z
    .enum([
      "planificando",
      "confirmado",
      "en_progreso",
      "completado",
      "cancelado",
    ])
    .default("planificando"),
  trabajadores_asignados: z.array(z.string().uuid()).default([]),
  checklist: z.record(z.any()).optional(),
  preregistration_id: z.string().uuid().optional(),
});

export const eventUpdateSchema = eventSchema.partial();

// ========================================
// SCHEMAS DE NOTIFICACIONES
// ========================================

export const notificationSchema = z.object({
  user_id: z.string().uuid("ID de usuario inválido"),
  title: z.string().min(1, "El título es requerido").max(200),
  message: z.string().min(1, "El mensaje es requerido").max(1000),
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  is_read: z.boolean().default(false),
  data: z.record(z.any()).optional(),
});

export const notificationUpdateSchema = notificationSchema.partial();

// ========================================
// SCHEMAS DE TRABAJADORES
// ========================================

export const workerSchema = z.object({
  user_id: z.string().uuid("ID de usuario inválido"),
  position: z.string().min(1, "La posición es requerida"),
  hire_date: z.string().datetime("Fecha de contratación inválida"),
  salary: z.number().min(0, "El salario no puede ser negativo"),
  is_active: z.boolean().default(true),
  skills: z.array(z.string()).default([]),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
});

export const workerUpdateSchema = workerSchema.partial();

// ========================================
// SCHEMAS DE PENALIZACIONES
// ========================================

export const penaltySchema = z.object({
  worker_id: z.string().uuid("ID de trabajador inválido"),
  reason: z.string().min(1, "La razón es requerida").max(500),
  penalty_type: z.enum(["warning", "suspension", "fine", "termination"]),
  points: z.number().int().min(1, "Los puntos deben ser al menos 1").max(100),
  status: z.enum(["active", "appealed", "resolved"]).default("active"),
  event_id: z.string().uuid("ID de evento inválido").optional(),
  admin_notes: z.string().optional(),
});

export const penaltyUpdateSchema = penaltySchema.partial();

// ========================================
// SCHEMAS DE CONFLICTOS
// ========================================

export const conflictSchema = z.object({
  worker_id: z.string().uuid("ID de trabajador inválido"),
  event_id: z.string().uuid("ID de evento inválido"),
  conflict_type: z.enum([
    "schedule_overlap",
    "double_assignment",
    "availability_conflict",
  ]),
  description: z.string().min(1, "La descripción es requerida").max(500),
  status: z.enum(["open", "resolved", "ignored"]).default("open"),
  resolution_notes: z.string().optional(),
});

export const conflictUpdateSchema = conflictSchema.partial();

// ========================================
// SCHEMAS DE EVALUACIONES
// ========================================

export const evaluationSchema = z.object({
  worker_id: z.string().uuid("ID de trabajador inválido"),
  evaluator_id: z.string().uuid("ID de evaluador inválido"),
  event_id: z.string().uuid("ID de evento inválido").optional(),
  rating: z
    .number()
    .min(1, "La calificación debe ser al menos 1")
    .max(5, "La calificación no puede exceder 5"),
  comments: z.string().optional(),
  categories: z.record(z.number().min(1).max(5)).optional(),
  is_anonymous: z.boolean().default(false),
});

export const evaluationUpdateSchema = evaluationSchema.partial();

// ========================================
// SCHEMAS DE DOCUMENTOS
// ========================================

export const documentSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200),
  description: z.string().optional(),
  file_name: z.string().min(1, "El nombre del archivo es requerido"),
  file_type: z.string().min(1, "El tipo de archivo es requerido"),
  file_size: z.number().min(0, "El tamaño del archivo no puede ser negativo"),
  document_type: z.enum([
    "contract",
    "invoice",
    "receipt",
    "certificate",
    "manual",
    "template",
    "report",
    "other",
  ]),
  category: z.enum([
    "legal",
    "financial",
    "operational",
    "hr",
    "client",
    "event",
    "training",
    "other",
  ]),
  is_public: z.boolean().default(false),
  event_id: z.string().uuid("ID de evento inválido").optional(),
  worker_id: z.string().uuid("ID de trabajador inválido").optional(),
});

export const documentUpdateSchema = documentSchema.partial();

// ========================================
// SCHEMAS DE INTEGRACIONES
// ========================================

export const integrationSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  integration_type: z.enum([
    "payment",
    "calendar",
    "email",
    "sms",
    "storage",
    "crm",
    "accounting",
    "other",
  ]),
  provider: z.string().min(1, "El proveedor es requerido").max(100),
  configuration: z.record(z.any()),
  webhook_url: z.string().url("URL de webhook inválida").optional(),
  api_endpoint: z.string().url("Endpoint de API inválido").optional(),
  sync_frequency: z
    .number()
    .min(60, "La frecuencia de sincronización debe ser al menos 60 segundos"),
  is_active: z.boolean().default(true),
});

export const integrationUpdateSchema = integrationSchema.partial();

// ========================================
// SCHEMAS DE EMPLEADORES
// ========================================

export const employerSchema = z.object({
  user_id: z.string().uuid("ID de usuario inválido"),
  company_name: z
    .string()
    .min(1, "El nombre de la empresa es requerido")
    .max(255),
  company_type: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  total_events: z.number().int().min(0).default(0),
  total_spent: z.number().min(0).default(0),
  rating: z.number().min(0).max(5).default(0),
  status: z.enum(["active", "inactive", "premium"]).default("active"),
});

export const employerUpdateSchema = employerSchema.partial();

// ========================================
// SCHEMAS DE COTIZACIONES
// ========================================

export const quoteSchema = z.object({
  event_id: z.string().uuid("ID de evento inválido").optional(),
  client_name: z.string().min(1, "El nombre del cliente es requerido").max(255),
  client_email: z.string().email("Email inválido"),
  client_phone: z.string().optional(),
  event_type: z.string().min(1, "El tipo de evento es requerido"),
  event_date: z.string().datetime("Fecha de evento inválida"),
  guest_count: z.number().int().min(1).max(10000),
  base_price: z.number().min(0, "El precio base no puede ser negativo"),
  services: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      quantity: z.number().min(1),
      unit_price: z.number().min(0),
      total: z.number().min(0),
    })
  ),
  subtotal: z.number().min(0),
  taxes: z.number().min(0),
  total: z.number().min(0),
  expiration_date: z.string().datetime("Fecha de expiración inválida"),
  status: z
    .enum(["draft", "sent", "accepted", "rejected", "expired"])
    .default("draft"),
  notes: z.string().optional(),
});

export const quoteUpdateSchema = quoteSchema.partial();

// ========================================
// SCHEMAS DE WEBHOOKS
// ========================================

export const webhookSchema = z.object({
  integration_id: z.string().uuid("ID de integración inválido"),
  name: z.string().min(1, "El nombre es requerido").max(100),
  url: z.string().url("URL inválida"),
  events: z.array(z.string()).min(1, "Debe haber al menos un evento"),
  is_active: z.boolean().default(true),
  retry_count: z.number().int().min(0).max(10).default(3),
  timeout_seconds: z.number().int().min(5).max(300).default(30),
});

export const webhookUpdateSchema = webhookSchema.partial();

// ========================================
// SCHEMAS DE CONSULTAS
// ========================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
});

// ========================================
// SCHEMAS DE RESPUESTAS
// ========================================

export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      total_pages: z.number(),
    })
    .optional(),
});

// ========================================
// UTILIDADES DE VALIDACIÓN
// ========================================

export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }));
      throw new Error(`Validation error: ${JSON.stringify(formattedErrors)}`);
    }
    throw error;
  }
};

export const safeParseSchema = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  return schema.safeParse(data);
};
