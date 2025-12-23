"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";

interface Event {
  id: string;
  titulo: string;
  fecha_evento: string;
}

interface Worker {
  id: string;
  specialization: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

const incidentTypes = [
  { value: "no_show", label: "No se presentó" },
  { value: "late_arrival", label: "Llegó tarde" },
  { value: "poor_performance", label: "Desempeño deficiente" },
  { value: "other", label: "Otro" },
];

export default function ReportIncidentPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [formData, setFormData] = useState({
    worker_id: "",
    incident_type: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchEventData();
    fetchWorkers();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar evento");
      }

      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/workers`);
      const data = await response.json();

      if (response.ok && data.success) {
        setWorkers(data.workers || []);
      }
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    if (!formData.worker_id || !formData.incident_type || !formData.description.trim()) {
      setError("Todos los campos son requeridos");
      setSubmitting(false);
      return;
    }

    if (formData.description.trim().length < 10) {
      setError("La descripción debe tener al menos 10 caracteres");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          worker_id: formData.worker_id,
          incident_type: formData.incident_type,
          description: formData.description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al crear reporte");
      }

      setSuccess(true);
      if (data.suspended) {
        alert("El trabajador ha sido suspendido automáticamente por acumular 3 reportes de incidencia.");
      }

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push(`/events/${eventId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Reportar Incidencia</h1>
          <p className="text-muted-foreground">{event?.titulo}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Reporte de incidencia creado exitosamente. Redirigiendo...
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Incidencia</CardTitle>
          <CardDescription>
            Proporciona información detallada sobre la incidencia ocurrida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="worker_id">Trabajador *</Label>
              <Select
                value={formData.worker_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, worker_id: value })
                }
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el trabajador" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.users?.name || "Sin nombre"} - {worker.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {workers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay trabajadores asignados a este evento
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident_type">Tipo de Incidencia *</Label>
              <Select
                value={formData.incident_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, incident_type: value })
                }
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Describe detalladamente la incidencia ocurrida..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={submitting}
                rows={6}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 caracteres (mínimo 10)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Reportar Incidencia
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
