import { Database } from "@/lib/database.types";

type Worker = Database["public"]["Tables"]["workers"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];

// Calcular nivel de lealtad basado en puntos
export function calculateLoyaltyLevel(points: number): "bronze" | "silver" | "gold" | "platinum" {
  if (points >= 1000) return "platinum";
  if (points >= 500) return "gold";
  if (points >= 100) return "silver";
  return "bronze";
}

// Formatear datos del trabajador para el frontend (manteniendo compatibilidad)
export function formatWorkerData(worker: Worker, user: User) {
  return {
    id: worker.id,
    name: `${user.first_name} ${user.last_name}`.trim() || "Sin nombre",
    email: user.email || "Sin email",
    phone: user.phone || "Sin teléfono",
    position: worker.specialization || "Sin especialización",
    rating: worker.rating || 0,
    eventsCompleted: worker.total_events || 0,
    status: worker.availability_status === "available" ? "activo" : "inactivo",
    joinDate: worker.created_at || new Date().toISOString(),
    hourlyRate: worker.hourly_rate || 0,
    specialization: worker.specialization,
    experienceYears: worker.experience_years,
    loyaltyLevel: worker.loyalty_level,
    loyaltyPoints: worker.loyalty_points,
    // Campos adicionales para compatibilidad
    full_name: `${user.first_name} ${user.last_name}`.trim(),
    first_name: user.first_name,
    last_name: user.last_name,
  };
}

// Calcular estadísticas agregadas
export function calculateWorkerStats(workers: ReturnType<typeof formatWorkerData>[]) {
  if (workers.length === 0) {
    return {
      total: 0,
      active: 0,
      averageRating: 0,
      totalEvents: 0,
      averageHourlyRate: 0,
    };
  }

  return {
    total: workers.length,
    active: workers.filter((w) => w.status === "activo").length,
    averageRating: Number(
      (workers.reduce((acc, w) => acc + w.rating, 0) / workers.length).toFixed(1)
    ),
    totalEvents: workers.reduce((acc, w) => acc + w.eventsCompleted, 0),
    averageHourlyRate: Math.round(
      workers.reduce((acc, w) => acc + w.hourlyRate, 0) / workers.length
    ),
  };
}

// Aplicar filtros a la consulta
export function applyWorkerFilters(query: any, filters: any) {
  if (filters.specialization) {
    query = query.eq("specialization", filters.specialization);
  }
  if (filters.availability_status) {
    query = query.eq("availability_status", filters.availability_status);
  }
  if (filters.min_rating !== undefined) {
    query = query.gte("rating", filters.min_rating);
  }
  if (filters.max_hourly_rate !== undefined) {
    query = query.lte("hourly_rate", filters.max_hourly_rate);
  }
  if (filters.min_experience_years !== undefined) {
    query = query.gte("experience_years", filters.min_experience_years);
  }
  return query;
}
