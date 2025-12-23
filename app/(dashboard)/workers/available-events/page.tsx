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
import { Input } from "@/components/ui/input";
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
  Users,
  Search,
  Send,
  AlertCircle,
} from "lucide-react";

interface Event {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha_evento: string;
  hora_inicio?: string;
  hora_fin?: string;
  ubicacion?: string;
  tipo_evento?: string;
  numero_invitados?: number;
  estado: string;
}

export default function AvailableEventsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [applying, setApplying] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAvailableEvents();
  }, []);

  const fetchAvailableEvents = async () => {
    try {
      setLoading(true);
      // TODO: Crear API para obtener eventos disponibles para trabajadores
      // Por ahora usar endpoint de eventos general
      const response = await fetch("/api/events");
      const data = await response.json();

      if (response.ok && data.success) {
        // Filtrar solo eventos en estados válidos para postular
        const availableEvents = (data.data?.events || data.events || []).filter(
          (event: Event) =>
            event.estado !== "completed" &&
            event.estado !== "cancelled" &&
            new Date(event.fecha_evento) >= new Date()
        );
        setEvents(availableEvents);
      } else {
        setEvents([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (eventId: string) => {
    setApplying({ ...applying, [eventId]: true });
    setError("");

    try {
      const response = await fetch(`/api/events/${eventId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al postular al evento");
      }

      // Refrescar lista
      fetchAvailableEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setApplying({ ...applying, [eventId]: false });
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || event.tipo_evento === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Eventos Disponibles</h1>
        <p className="text-muted-foreground">
          Postula a eventos que coincidan con tus habilidades
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Boda">Boda</SelectItem>
                <SelectItem value="Corporativo">Corporativo</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay eventos disponibles para postular
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{event.titulo}</h3>
                      {event.tipo_evento && (
                        <Badge variant="outline">{event.tipo_evento}</Badge>
                      )}
                    </div>

                    {event.descripcion && (
                      <p className="text-sm text-muted-foreground">
                        {event.descripcion}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(event.fecha_evento).toLocaleDateString()}
                        </span>
                      </div>
                      {(event.hora_inicio || event.hora_fin) && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {event.hora_inicio || "N/A"} - {event.hora_fin || "N/A"}
                          </span>
                        </div>
                      )}
                      {event.ubicacion && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.ubicacion}</span>
                        </div>
                      )}
                      {event.numero_invitados && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{event.numero_invitados} invitados</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleApply(event.id)}
                    disabled={applying[event.id]}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {applying[event.id] ? "Postulando..." : "Postular"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
