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
import { WorkerBadges } from "@/components/worker-badges";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Application {
  id: string;
  role?: string;
  payment_agreed?: number;
  created_at: string;
  workers: {
    id: string;
    specialization: string;
    rating?: number;
    badges?: string[];
    users: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export default function EventApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [workerRoles, setWorkerRoles] = useState<Record<string, string>>({});
  const [workerPayments, setWorkerPayments] = useState<Record<string, number>>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApplications();
  }, [eventId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/applications`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar postulaciones");
      }

      setApplications(data.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApplication = (applicationId: string) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
      const newRoles = { ...workerRoles };
      const newPayments = { ...workerPayments };
      delete newRoles[applicationId];
      delete newPayments[applicationId];
      setWorkerRoles(newRoles);
      setWorkerPayments(newPayments);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const handleAssignSelected = async () => {
    if (selectedApplications.size === 0) {
      setError("Debes seleccionar al menos una postulación");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const workerIds = applications
        .filter((app) => selectedApplications.has(app.id))
        .map((app) => app.workers.id);

      const roles: Record<string, string> = {};
      const payments: Record<string, number> = {};

      applications
        .filter((app) => selectedApplications.has(app.id))
        .forEach((app) => {
          if (workerRoles[app.id]) {
            roles[app.workers.id] = workerRoles[app.id];
          }
          if (workerPayments[app.id]) {
            payments[app.workers.id] = workerPayments[app.id];
          }
        });

      const response = await fetch(`/api/events/${eventId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worker_ids: workerIds,
          roles,
          payment_agreed: payments,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al asignar trabajadores");
      }

      // Refrescar lista
      fetchApplications();
      setSelectedApplications(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando postulaciones...</p>
        </div>
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
          <h1 className="text-3xl font-bold">Postulaciones de Trabajadores</h1>
          <p className="text-muted-foreground">
            Revisa y asigna trabajadores que han postulado a este evento
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No hay postulaciones para este evento
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Postulaciones ({applications.length})
              </CardTitle>
              <CardDescription>
                Selecciona las postulaciones que deseas aceptar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((application) => {
                  const isSelected = selectedApplications.has(application.id);
                  return (
                    <div
                      key={application.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleApplication(application.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {application.workers?.users?.name || "Sin nombre"}
                          </h3>
                          {application.workers?.rating !== undefined &&
                            application.workers.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">
                                  {application.workers.rating.toFixed(1)}/5
                                </span>
                              </div>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {application.workers?.specialization}
                        </p>
                        <WorkerBadges
                          badges={application.workers?.badges || []}
                          rating={application.workers?.rating}
                          className="mb-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Postuló el{" "}
                          {new Date(application.created_at).toLocaleDateString()}
                        </p>
                        {isSelected && (
                          <div className="mt-3 space-y-2">
                            <div>
                              <Label htmlFor={`role-${application.id}`}>Rol</Label>
                              <Input
                                id={`role-${application.id}`}
                                placeholder="Ej: mesero, coctelero..."
                                value={workerRoles[application.id] || ""}
                                onChange={(e) =>
                                  setWorkerRoles({
                                    ...workerRoles,
                                    [application.id]: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor={`payment-${application.id}`}>
                                Pago Acordado (CLP)
                              </Label>
                              <Input
                                id={`payment-${application.id}`}
                                type="number"
                                placeholder="0"
                                value={workerPayments[application.id] || ""}
                                onChange={(e) =>
                                  setWorkerPayments({
                                    ...workerPayments,
                                    [application.id]: parseFloat(e.target.value) || 0,
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

          {selectedApplications.size > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedApplications.size} postulación(es) seleccionada(s)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Asignará estos trabajadores al evento
                    </p>
                  </div>
                  <Button
                    onClick={handleAssignSelected}
                    disabled={processing}
                    size="lg"
                  >
                    {processing ? "Asignando..." : "Asignar Seleccionados"}
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
