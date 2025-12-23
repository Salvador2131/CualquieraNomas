"use client";

import { useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Eye,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Incident {
  id: string;
  incident_type: string;
  description: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
  events: {
    id: string;
    titulo: string;
    fecha_evento: string;
  };
  workers: {
    id: string;
    specialization: string;
    users: {
      id: string;
      name: string;
      email: string;
    };
  };
  reported_by: {
    id: string;
    name: string;
    email: string;
  };
  reviewed_by?: {
    id: string;
    name: string;
  };
}

const incidentTypeLabels: Record<string, string> = {
  no_show: "No se presentó",
  late_arrival: "Llegó tarde",
  poor_performance: "Desempeño deficiente",
  other: "Otro",
};

export default function SuperAdminIncidentsPage() {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveStatus, setResolveStatus] = useState<"reviewed" | "resolved" | "dismissed">("reviewed");
  const [resolveNotes, setResolveNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/incidents${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar reportes");
      }

      setIncidents(data.incidents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedIncident) return;

    setResolving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/incidents/${selectedIncident.id}/resolve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: resolveStatus,
            notes: resolveNotes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al resolver reporte");
      }

      // Refrescar lista
      fetchIncidents();
      setIsResolveDialogOpen(false);
      setSelectedIncident(null);
      setResolveNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendiente", variant: "secondary" },
      reviewed: { label: "Revisado", variant: "outline" },
      resolved: { label: "Resuelto", variant: "default" },
      dismissed: { label: "Desestimado", variant: "outline" },
    };

    const config = configs[status] || configs.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes de Incidencia</h1>
          <p className="text-muted-foreground">
            Gestiona y revisa los reportes de incidencia de trabajadores
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="reviewed">Revisados</SelectItem>
            <SelectItem value="resolved">Resueltos</SelectItem>
            <SelectItem value="dismissed">Desestimados</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Incidents List */}
      {incidents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay reportes {statusFilter !== "all" ? "con este estado" : ""}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {incidents.map((incident) => (
            <Card key={incident.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {incidentTypeLabels[incident.incident_type] || incident.incident_type}
                      </h3>
                      {getStatusBadge(incident.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Trabajador</p>
                        <p className="font-medium">
                          {incident.workers?.users?.name || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {incident.workers?.users?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Evento</p>
                        <p className="font-medium">
                          {incident.events?.titulo || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {incident.events?.fecha_evento &&
                            new Date(incident.events.fecha_evento).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reportado por</p>
                        <p className="font-medium">
                          {incident.reported_by?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha</p>
                        <p className="font-medium">
                          {new Date(incident.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">Descripción:</p>
                      <p className="text-sm text-muted-foreground">
                        {incident.description}
                      </p>
                    </div>

                    {incident.reviewed_by && (
                      <p className="text-xs text-muted-foreground">
                        Revisado por {incident.reviewed_by.name} el{" "}
                        {incident.reviewed_at &&
                          new Date(incident.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {incident.status === "pending" && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedIncident(incident);
                          setIsResolveDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Revisar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar Reporte de Incidencia</DialogTitle>
            <DialogDescription>
              {selectedIncident?.events?.titulo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Acción</Label>
              <Select
                value={resolveStatus}
                onValueChange={(value: "reviewed" | "resolved" | "dismissed") =>
                  setResolveStatus(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewed">Marcar como Revisado</SelectItem>
                  <SelectItem value="resolved">Resolver</SelectItem>
                  <SelectItem value="dismissed">Desestimar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Notas sobre la resolución..."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsResolveDialogOpen(false);
                setSelectedIncident(null);
                setResolveNotes("");
              }}
              disabled={resolving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleResolve}
              disabled={resolving}
            >
              {resolving ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
