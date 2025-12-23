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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Assignment {
  id: string;
  role?: string;
  status: string;
  payment_agreed?: number;
  accepted_at?: string;
  created_at: string;
  events: {
    id: string;
    titulo: string;
    fecha_evento: string;
    hora_inicio?: string;
    hora_fin?: string;
    ubicacion?: string;
    estado: string;
    numero_invitados?: number;
  };
}

export default function WorkerAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/workers/assignments${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar asignaciones");
      }

      setAssignments(data.assignments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptReject = async (assignmentId: string, accepted: boolean) => {
    try {
      const response = await fetch(`/api/workers/assignments/${assignmentId}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accepted }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al procesar asignación");
      }

      // Refrescar lista
      fetchAssignments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      assigned: { label: "Pendiente", variant: "secondary" },
      accepted: { label: "Aceptada", variant: "default" },
      rejected: { label: "Rechazada", variant: "destructive" },
      completed: { label: "Completada", variant: "outline" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };

    const config = configs[status] || configs.assigned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando asignaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Asignaciones</h1>
          <p className="text-muted-foreground">
            Gestiona tus asignaciones de eventos
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="assigned">Pendientes</SelectItem>
            <SelectItem value="accepted">Aceptadas</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No tienes asignaciones {statusFilter !== "all" ? "con este estado" : ""}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {assignment.events?.titulo || "Sin título"}
                      </h3>
                      {getStatusBadge(assignment.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(assignment.events?.fecha_evento || "").toLocaleDateString()}
                        </span>
                      </div>
                      {(assignment.events?.hora_inicio || assignment.events?.hora_fin) && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {assignment.events?.hora_inicio || "N/A"} -{" "}
                            {assignment.events?.hora_fin || "N/A"}
                          </span>
                        </div>
                      )}
                      {assignment.events?.ubicacion && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{assignment.events.ubicacion}</span>
                        </div>
                      )}
                      {assignment.payment_agreed && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>
                            ${assignment.payment_agreed.toLocaleString("es-CL")} CLP
                          </span>
                        </div>
                      )}
                    </div>

                    {assignment.role && (
                      <div>
                        <Badge variant="outline">Rol: {assignment.role}</Badge>
                      </div>
                    )}

                    {assignment.status === "accepted" && assignment.accepted_at && (
                      <p className="text-xs text-muted-foreground">
                        Aceptada el{" "}
                        {new Date(assignment.accepted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {assignment.status === "assigned" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptReject(assignment.id, true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAcceptReject(assignment.id, false)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      </>
                    )}
                    {assignment.status === "accepted" && assignment.events?.id && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/events/${assignment.events.id}/chat`}>
                          Ver Chat
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
