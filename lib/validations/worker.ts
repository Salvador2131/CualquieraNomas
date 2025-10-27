import { z } from "zod";

// Schema para crear un trabajador
export const createWorkerSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().min(1, "La especialización es requerida"),
  experience_years: z.number().min(0, "Los años de experiencia deben ser >= 0"),
  hourly_rate: z.number().min(0, "La tarifa por hora debe ser >= 0"),
});

// Schema para actualizar un trabajador
export const updateWorkerSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido").optional(),
  last_name: z.string().min(1, "El apellido es requerido").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().min(1, "La especialización es requerida").optional(),
  experience_years: z.number().min(0, "Los años de experiencia deben ser >= 0").optional(),
  hourly_rate: z.number().min(0, "La tarifa por hora debe ser >= 0").optional(),
  availability_status: z.enum(["available", "busy", "unavailable"]).optional(),
});

// Schema para actualizar rating
export const updateRatingSchema = z.object({
  rating: z.number().min(0).max(5, "El rating debe estar entre 0 y 5"),
});

// Schema para actualizar loyalty
export const updateLoyaltySchema = z.object({
  loyalty_points: z.number().min(0, "Los puntos de lealtad deben ser >= 0"),
  loyalty_level: z.enum(["bronze", "silver", "gold", "platinum"]).optional(),
});

// Schema para filtros de búsqueda
export const workerFiltersSchema = z.object({
  specialization: z.string().optional(),
  availability_status: z.enum(["available", "busy", "unavailable"]).optional(),
  min_rating: z.number().min(0).max(5).optional(),
  max_hourly_rate: z.number().min(0).optional(),
  min_experience_years: z.number().min(0).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;
export type UpdateRatingInput = z.infer<typeof updateRatingSchema>;
export type UpdateLoyaltyInput = z.infer<typeof updateLoyaltySchema>;
export type WorkerFilters = z.infer<typeof workerFiltersSchema>;
