"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface DashboardStats {
  totalCompanies: number;
  totalWorkers: number;
  activeWorkers: number;
  approvedWorkers: number;
  pendingWorkers: number;
  freeWorkers: number;
  paidWorkers: number;
  eventsThisMonth: number;
  totalIncome: number;
}

interface PendingWorker {
  id: string;
  specialization: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface UpcomingRenewal {
  id: string;
  subscription_type: string;
  subscription_end_date: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingWorkers, setPendingWorkers] = useState<PendingWorker[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>(
    []
  );
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/superadmin/dashboard");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar dashboard");
      }

      setStats(data.data.summary);
      setPendingWorkers(data.data.pendingActions.workersToApprove || []);
      setUpcomingRenewals(data.data.pendingActions.upcomingRenewals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWorker = async (workerId: string, approved: boolean) => {
    try {
      const response = await fetch(
        `/api/superadmin/workers/${workerId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approved,
            subscription_type: "free",
            subscription_months: approved ? 3 : undefined,
            reason: approved ? undefined : "No cumple con los requisitos",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al aprobar trabajador");
      }

      // Refrescar datos
      fetchDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => router.push("/auth/login")} className="mt-4">
              Volver al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel SuperAdmin</h1>
          <p className="text-muted-foreground">
            Control total del sistema y gestión de accesos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin-super/certificates")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Verificar Certificados
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin-super/incidents")}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reportes de Incidencia
            </Button>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            SuperAdmin
          </Badge>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empresas Activas
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalCompanies || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Suscripciones activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Trabajadores Totales
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWorkers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeWorkers || 0} activos, {stats?.pendingWorkers || 0}{" "}
              pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos Este Mes
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.eventsThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">Eventos creados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalIncome || 0).toLocaleString("es-CL")} CLP
            </div>
            <p className="text-xs text-muted-foreground">
              De trabajadores pagando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose de Trabajadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <UserCheck className="h-4 w-4 mr-2 text-green-500" />
              Trabajadores Aprobados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.approvedWorkers || 0}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              <div>Gratis: {stats?.freeWorkers || 0}</div>
              <div>Pagando: {stats?.paidWorkers || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <UserX className="h-4 w-4 mr-2 text-yellow-500" />
              Pendientes de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pendingWorkers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requieren revisión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
              Tasa de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalWorkers
                ? Math.round(
                    ((stats.approvedWorkers || 0) / stats.totalWorkers) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Trabajadores aprobados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Pendientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trabajadores por Aprobar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
              Trabajadores por Aprobar
            </CardTitle>
            <CardDescription>
              {pendingWorkers.length} trabajadores esperando aprobación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingWorkers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay trabajadores pendientes
                </p>
              ) : (
                pendingWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {worker.users?.name || "Sin nombre"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {worker.users?.email}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Especialización: {worker.specialization}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Registrado:{" "}
                        {new Date(worker.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveWorker(worker.id, false)}
                      >
                        Rechazar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveWorker(worker.id, true)}
                      >
                        Aprobar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Próximas Renovaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              Próximas Renovaciones
            </CardTitle>
            <CardDescription>
              Suscripciones que expiran en los próximos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRenewals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay renovaciones próximas
                </p>
              ) : (
                upcomingRenewals.map((renewal) => (
                  <div
                    key={renewal.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {renewal.users?.name || "Sin nombre"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {renewal.users?.email}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Tipo: {renewal.subscription_type}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expira:{" "}
                        {new Date(
                          renewal.subscription_end_date
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Navegar a página de gestión de trabajador
                        router.push(`/admin-super/workers/${renewal.id}`);
                      }}
                    >
                      Gestionar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
