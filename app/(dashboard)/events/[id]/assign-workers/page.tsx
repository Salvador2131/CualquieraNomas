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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkerBadges } from "@/components/worker-badges";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Worker {
  id: string;
  specialization: string;
  rating?: number;
  badges?: string[];
  users: {
    id: string;
    name: string;
    email: string;
  };
}

interface Event {
  id: string;
  titulo: string;
  fecha_evento: string;
  hora_inicio?: string;
  hora_fin?: string;
  ubicacion?: string;
}

export default function AssignWorkersPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set());
  const [workerRoles, setWorkerRoles] = useState<Record<string, string>>({});
  const [workerPayments, setWorkerPayments] = useState<Record<string, number>>({});
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [minRatingFilter, setMinRatingFilter] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEventData();
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

  const searchWorkers = async () => {
    setSearching(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (specializationFilter) params.append("specialization", specializationFilter);
      if (minRatingFilter) params.append("minRating", minRatingFilter);

      const response = await fetch(
        `/api/events/${eventId}/available-workers?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al buscar trabajadores");
      }

      setWorkers(data.workers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSearching(false);
    }
  };

  const handleToggleWorker = (workerId: string) => {
    const newSelected = new Set(selectedWorkers);
    if (newSelected.has(workerId)) {
      newSelected.delete(workerId);
      // Limpiar datos del trabajador
      const newRoles = { ...workerRoles };
      const newPayments = { ...workerPayments };
      delete newRoles[workerId];
      delete newPayments[workerId];
      setWorkerRoles(newRoles);
      setWorkerPayments(newPayments);
    } else {
      newSelected.add(workerId);
    }
    setSelectedWorkers(newSelected);
  };

  const handleAssign = async () => {
    if (selectedWorkers.size === 0) {
      setError("Debes seleccionar al menos un trabajador");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${eventId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worker_ids: Array.from(selectedWorkers),
          roles: workerRoles,
          payment_agreed: workerPayments,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al asignar trabajadores");
      }

      // Redirigir a la página del evento
      router.push(`/events/${eventId}`);
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
          <h1 className="text-3xl font-bold">Asignar Trabajadores</h1>
          <p className="text-muted-foreground">{event?.titulo}</p>
        </div>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Trabajadores Disponibles</CardTitle>
          <CardDescription>
            Busca trabajadores disponibles para este evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Especialización</Label>
              <Input
                placeholder="Ej: coctelería, servicio, cocina..."
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Label>Rating Mínimo</Label>
              <Select value={minRatingFilter} onValueChange={setMinRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                  <SelectItem value="4.0">4.0+ estrellas</SelectItem>
                  <SelectItem value="3.5">3.5+ estrellas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={searchWorkers} disabled={searching}>
                <Search className="h-4 w-4 mr-2" />
                {searching ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Workers List */}
      {workers.length === 0 && !searching ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {workers.length === 0 && searching === false
                ? "Usa los filtros para buscar trabajadores disponibles"
                : "No se encontraron trabajadores disponibles"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Trabajadores Disponibles ({workers.length})
              </CardTitle>
              <CardDescription>
                Selecciona los trabajadores que deseas asignar a este evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workers.map((worker) => {
                  const isSelected = selectedWorkers.has(worker.id);
                  return (
                    <div
                      key={worker.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleWorker(worker.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {worker.users?.name || "Sin nombre"}
                          </h3>
                          {worker.rating !== undefined && worker.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">
                                {worker.rating.toFixed(1)}/5
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {worker.specialization}
                        </p>
                        <WorkerBadges
                          badges={worker.badges || []}
                          rating={worker.rating}
                          className="mb-2"
                        />
                        {isSelected && (
                          <div className="mt-3 space-y-2">
                            <div>
                              <Label htmlFor={`role-${worker.id}`}>Rol</Label>
                              <Input
                                id={`role-${worker.id}`}
                                placeholder="Ej: mesero, coctelero..."
                                value={workerRoles[worker.id] || ""}
                                onChange={(e) =>
                                  setWorkerRoles({
                                    ...workerRoles,
                                    [worker.id]: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor={`payment-${worker.id}`}>
                                Pago Acordado (CLP)
                              </Label>
                              <Input
                                id={`payment-${worker.id}`}
                                type="number"
                                placeholder="0"
                                value={workerPayments[worker.id] || ""}
                                onChange={(e) =>
                                  setWorkerPayments({
                                    ...workerPayments,
                                    [worker.id]: parseFloat(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {selectedWorkers.size > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedWorkers.size} trabajador(es) seleccionado(s)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revisa los detalles antes de asignar
                    </p>
                  </div>
                  <Button
                    onClick={handleAssign}
                    disabled={submitting}
                    size="lg"
                  >
                    {submitting ? "Asignando..." : "Asignar Trabajadores"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
