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
import { RatingForm } from "@/components/rating-form";
import { WorkerBadges } from "@/components/worker-badges";
import { Star, ArrowLeft, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Worker {
  id: string;
  specialization: string;
  rating?: number;
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
  estado: string;
}

export default function RateEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [ratings, setRatings] = useState<Record<string, boolean>>({});
  const [selectedWorker, setSelectedWorker] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEventData();
    fetchRatings();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar evento");
      }

      setEvent(data.event);

      // Obtener trabajadores asignados
      const workersResponse = await fetch(`/api/events/${eventId}/workers`);
      const workersData = await workersResponse.json();

      if (workersResponse.ok && workersData.success) {
        setWorkers(workersData.workers || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/rate`);
      const data = await response.json();

      if (response.ok && data.success) {
        const ratedWorkers: Record<string, boolean> = {};
        data.ratings?.forEach((rating: any) => {
          ratedWorkers[rating.worker_id] = true;
        });
        setRatings(ratedWorkers);
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
    }
  };

  const handleRatingSuccess = () => {
    fetchRatings();
    setSelectedWorker(null);
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

  if (error || !event) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Evento no encontrado"}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (event.estado !== "completed" && event.estado !== "completado") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Evento no completado</CardTitle>
            <CardDescription>
              Solo puedes calificar trabajadores de eventos completados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>Volver</Button>
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
        <div>
          <h1 className="text-3xl font-bold">Calificar Trabajadores</h1>
          <p className="text-muted-foreground">{event.titulo}</p>
        </div>
      </div>

      {/* Workers List */}
      {workers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No hay trabajadores asignados a este evento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workers.map((worker) => {
            const isRated = ratings[worker.id];
            return (
              <Card key={worker.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {worker.users?.name || "Sin nombre"}
                        </h3>
                        {isRated && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Calificado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {worker.specialization}
                      </p>
                      {worker.rating !== undefined && worker.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {worker.rating.toFixed(1)}/5
                          </span>
                        </div>
                      )}
                      <WorkerBadges
                        badges={[]}
                        rating={worker.rating}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={() =>
                        setSelectedWorker({
                          id: worker.id,
                          name: worker.users?.name || "Trabajador",
                        })
                      }
                      disabled={isRated}
                      variant={isRated ? "outline" : "default"}
                    >
                      {isRated ? "Ya Calificado" : "Calificar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rating Form Dialog */}
      {selectedWorker && (
        <RatingForm
          eventId={eventId}
          workerId={selectedWorker.id}
          workerName={selectedWorker.name}
          open={!!selectedWorker}
          onOpenChange={(open) => !open && setSelectedWorker(null)}
          onSuccess={handleRatingSuccess}
        />
      )}
    </div>
  );
}
