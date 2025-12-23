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
import { Badge } from "@/components/ui/badge";
import { WorkerBadges } from "@/components/worker-badges";
import {
  ArrowLeft,
  Star,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface Worker {
  id: string;
  specialization: string;
  rating?: number;
  users: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface Rating {
  id: string;
  score: number;
  comment: string;
  created_at: string;
  events: {
    id: string;
    titulo: string;
    fecha_evento: string;
  };
  users: {
    name: string;
  };
}

export default function WorkerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const workerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWorkerData();
    fetchRatings();
    fetchBadges();
  }, [workerId]);

  const fetchWorkerData = async () => {
    try {
      const response = await fetch(`/api/workers/${workerId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar trabajador");
      }

      setWorker(data.worker);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const response = await fetch(`/api/workers/${workerId}/ratings`);
      const data = await response.json();

      if (response.ok && data.success) {
        setRatings(data.ratings || []);
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
    }
  };

  const fetchBadges = async () => {
    try {
      const response = await fetch(`/api/workers/${workerId}/badges`);
      const data = await response.json();

      if (response.ok && data.success) {
        setBadges(data.badges || []);
      }
    } catch (err) {
      console.error("Error fetching badges:", err);
    }
  };

  // Preparar datos para gráfico
  const ratingDistribution = [1, 2, 3, 4, 5].map((score) => ({
    score: `${score}⭐`,
    count: ratings.filter((r) => r.score === score).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Trabajador no encontrado"}</p>
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
          <h1 className="text-3xl font-bold">
            {worker.users?.name || "Sin nombre"}
          </h1>
          <p className="text-muted-foreground">{worker.users?.email}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rating Promedio
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {worker.rating ? worker.rating.toFixed(1) : "0.0"}/5
            </div>
            <p className="text-xs text-muted-foreground">
              {ratings.length} calificación{ratings.length !== 1 ? "es" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Especialización
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {worker.specialization || "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Calificaciones
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratings.length}</div>
            <p className="text-xs text-muted-foreground">Eventos calificados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{badges.length}</div>
            <p className="text-xs text-muted-foreground">Logros obtenidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Badges y Logros</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkerBadges badges={badges} rating={worker.rating} />
          </CardContent>
        </Card>
      )}

      {/* Rating Chart */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Calificaciones</CardTitle>
            <CardDescription>
              Distribución de las calificaciones recibidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ratingDistribution.map((item) => (
                <div key={item.score} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium">{item.score}</div>
                  <div className="flex-1">
                    <div className="h-6 bg-muted rounded-full relative overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${
                            ratings.length > 0
                              ? (item.count / ratings.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm text-muted-foreground text-right">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Ratings */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calificaciones Recientes</CardTitle>
            <CardDescription>
              Últimas calificaciones recibidas por este trabajador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ratings.slice(0, 5).map((rating) => (
                <div
                  key={rating.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= rating.score
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">
                        {rating.score}/5
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {rating.comment}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Evento: {rating.events?.titulo || "N/A"}</span>
                      <span>•</span>
                      <span>
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {ratings.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Este trabajador aún no tiene calificaciones
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
