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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Eye,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  Plus,
  Filter,
} from "lucide-react";

interface Event {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo_evento: string;
  fecha_evento: string;
  hora_inicio?: string;
  hora_fin?: string;
  ubicacion: string;
  numero_invitados: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono?: string;
  presupuesto_total?: number;
  estado: "planificacion" | "en_progreso" | "completado" | "cancelado";
  servicios_contratados: string[];
  checklist: any;
  preregistro?: {
    id: string;
    nombre_completo: string;
    email: string;
  };
}

const estados = [
  {
    value: "planificacion",
    label: "Planificación",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "en_progreso",
    label: "En Progreso",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "completado",
    label: "Completado",
    color: "bg-green-100 text-green-800",
  },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [estado, setEstado] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (estado) params.append("estado", estado);

      const response = await fetch(`/api/events?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar los eventos");
      }

      setEvents(data.events || []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
  };

  const filteredEvents = events.filter(
    (event) =>
      event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.tipo_evento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchEvents();
  }, [estado]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
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
          <h2 className="text-3xl font-bold tracking-tight">
            Gestión de Eventos
          </h2>
          <p className="text-muted-foreground">
            Administra eventos y checklist de preparación
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Evento
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estadísticas Rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              {events.filter((e) => e.estado === "planificacion").length} en
              planificación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter((e) => e.estado === "en_progreso").length}
            </div>
            <p className="text-xs text-muted-foreground">Eventos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter((e) => e.estado === "completado").length}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Presupuesto Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {events
                .reduce((sum, event) => sum + (event.presupuesto_total || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">En eventos activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar por título, cliente o tipo de evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <Label htmlFor="estado">Estado</Label>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los estados</SelectItem>
              {estados.map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Lista de Eventos */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Eventos</CardTitle>
            <CardDescription>
              {filteredEvents.length} eventos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.titulo}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.tipo_evento} • {event.numero_invitados}{" "}
                          invitados
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {event.cliente_nombre}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.cliente_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>
                          {new Date(event.fecha_evento).toLocaleDateString()}
                        </div>
                        {event.hora_inicio && (
                          <div className="text-sm text-muted-foreground">
                            {event.hora_inicio} - {event.hora_fin || "TBD"}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          estados.find((e) => e.value === event.estado)?.color
                        }
                      >
                        {estados.find((e) => e.value === event.estado)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Gestionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detalles del Evento Seleccionado */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Gestión del Evento</CardTitle>
            <CardDescription>
              {selectedEvent
                ? `Checklist de ${selectedEvent.titulo}`
                : "Selecciona un evento para gestionar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <div className="space-y-6">
                {/* Información Básica */}
                <div>
                  <h4 className="font-semibold mb-3">Información del Evento</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Fecha:</strong>{" "}
                        {new Date(
                          selectedEvent.fecha_evento
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Ubicación:</strong> {selectedEvent.ubicacion}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Invitados:</strong>{" "}
                        {selectedEvent.numero_invitados}
                      </span>
                    </div>
                    {selectedEvent.presupuesto_total && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          <strong>Presupuesto:</strong> $
                          {selectedEvent.presupuesto_total.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <h4 className="font-semibold mb-3">Estado del Checklist</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedEvent.checklist || {}).map(
                      ([categoria, data]: [string, any]) => (
                        <div key={categoria} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium capitalize">
                              {categoria.replace(/_/g, " ")}
                            </h5>
                            <Badge
                              variant={
                                data.completado ? "default" : "secondary"
                              }
                            >
                              {data.completado ? "Completado" : "Pendiente"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {
                              Object.entries(data).filter(
                                ([key]) => key !== "completado"
                              ).length
                            }{" "}
                            elementos
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Servicios Contratados */}
                {selectedEvent.servicios_contratados.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">
                      Servicios Contratados
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.servicios_contratados.map((service) => (
                        <Badge key={service} variant="outline">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Acciones</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Checklist
                    </Button>
                    <Button size="sm" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Asignar Personal
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Editar Evento
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Selecciona un evento para gestionar su checklist
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
