"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  Clock,
  Star,
  Bell,
  RefreshCw,
  LogOut,
} from "lucide-react";
import Link from "next/link";

interface WorkerStats {
  assignedEvents: number;
  completedEvents: number;
  upcomingEvents: number;
  averageRating: number;
  totalEarnings: number;
  error?: boolean;
  message?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  status: "assigned" | "completed" | "upcoming";
  role: string;
  pay: number;
}

export default function WorkerDashboard() {
  const [stats, setStats] = useState<WorkerStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkerData = async () => {
    try {
      // Simular datos del trabajador (en producción vendría de la API)
      setStats({
        assignedEvents: 12,
        completedEvents: 8,
        upcomingEvents: 4,
        averageRating: 4.7,
        totalEarnings: 2400,
      });

      setEvents([
        {
          id: "1",
          title: "Boda María & Carlos",
          date: "2024-01-15",
          location: "Hotel Plaza",
          status: "upcoming",
          role: "Garzón",
          pay: 150,
        },
        {
          id: "2",
          title: "Evento Corporativo TechCorp",
          date: "2024-01-20",
          location: "Centro de Convenciones",
          status: "upcoming",
          role: "Bartender",
          pay: 200,
        },
        {
          id: "3",
          title: "Quinceañera Ana",
          date: "2024-01-10",
          location: "Salón de Fiestas",
          status: "completed",
          role: "Garzón",
          pay: 120,
        },
      ]);
    } catch (error) {
      console.error("Error fetching worker data:", error);
      setStats({
        assignedEvents: 0,
        completedEvents: 0,
        upcomingEvents: 0,
        averageRating: 0,
        totalEarnings: 0,
        error: true,
        message: "Error al cargar datos del trabajador",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWorkerData();
  };

  const handleLogout = () => {
    // Limpiar sesión y redirigir al login
    document.cookie =
      "user-session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    window.location.href = "/auth/login";
  };

  useEffect(() => {
    fetchWorkerData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Mi Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cargando...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mi Dashboard</h2>
          <p className="text-muted-foreground">
            Gestiona tus eventos asignados
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {stats?.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error de Conexión</CardTitle>
            <CardDescription className="text-red-600">
              {stats.message}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos Asignados
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.assignedEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.upcomingEvents || 0} próximos,{" "}
              {stats?.completedEvents || 0} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calificación Promedio
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageRating || 0}/5
            </div>
            <p className="text-xs text-muted-foreground">
              Basada en {stats?.completedEvents || 0} eventos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganancias Totales
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalEarnings?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos Eventos
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.upcomingEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              En los próximos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Mis Eventos</CardTitle>
            <CardDescription>Eventos asignados y próximos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.location}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.date}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge
                      variant={
                        event.status === "completed" ? "secondary" : "default"
                      }
                    >
                      {event.status === "completed"
                        ? "Completado"
                        : event.status === "upcoming"
                        ? "Próximo"
                        : "Asignado"}
                    </Badge>
                    <p className="text-sm font-medium">${event.pay}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>Últimas actualizaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Bell className="h-4 w-4 text-blue-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">Nuevo evento asignado</p>
                  <p className="text-xs text-muted-foreground">
                    Boda María & Carlos - 15 Ene
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Star className="h-4 w-4 text-yellow-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">Calificación recibida</p>
                  <p className="text-xs text-muted-foreground">
                    5 estrellas en Quinceañera Ana
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 text-green-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">Pago procesado</p>
                  <p className="text-xs text-muted-foreground">
                    $120 por evento completado
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
