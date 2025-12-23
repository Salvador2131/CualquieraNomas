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
  Loader2,
  AlertCircle,
  MessageSquare,
  Star,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/pagination";
import { useToast } from "@/hooks/use-toast";
import { showApiError, showSuccess } from "@/lib/utils/toast-helpers";
import { useDebounce } from "@/lib/hooks/use-debounce";

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
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [estado, setEstado] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    tipo_evento: "",
    fecha_evento: "",
    hora_inicio: "",
    hora_fin: "",
    ubicacion: "",
    numero_invitados: "",
    cliente_nombre: "",
    cliente_email: "",
    cliente_telefono: "",
    presupuesto_total: "",
  });

  const fetchEvents = async (page: number = currentPage) => {
    try {
      setError(""); // Limpiar error anterior
      const params = new URLSearchParams();
      if (estado && estado !== "all") params.append("estado", estado);
      params.append("page", page.toString());
      params.append("limit", itemsPerPage.toString());

      const response = await fetch(
        `/api/events?${params.toString()}&t=${Date.now()}`
      ); // Agregar timestamp para evitar cache
      const data = await response.json();

      console.log("Events API Response:", data); // Debug log

      if (response.ok && data.success) {
        // La respuesta tiene estructura: { success: true, data: { events: [...], pagination: {...} } }
        const eventsData = data.data?.events || data.events || [];
        console.log("Events from API:", eventsData); // Debug log
        setEvents(eventsData);
      } else {
        throw new Error(data.message || "Error al cargar los eventos");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      setEvents([]);
      if (!loading) {
        // Solo mostrar toast si no es la carga inicial
        showApiError(toast, err, "Error al cargar los eventos");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    showSuccess(toast, "Lista actualizada");
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const eventData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion || undefined,
        tipo_evento: formData.tipo_evento,
        fecha_evento: new Date(formData.fecha_evento).toISOString(),
        hora_inicio: formData.hora_inicio || undefined,
        hora_fin: formData.hora_fin || undefined,
        ubicacion: formData.ubicacion,
        numero_invitados: parseInt(formData.numero_invitados) || 0,
        cliente_nombre: formData.cliente_nombre,
        cliente_email: formData.cliente_email,
        cliente_telefono: formData.cliente_telefono || undefined,
        presupuesto_total: formData.presupuesto_total
          ? parseFloat(formData.presupuesto_total)
          : undefined,
        estado: "planificacion",
        servicios_contratados: [],
        checklist: {},
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess(true);
        showSuccess(toast, "Evento creado exitosamente");

        // Add new event to the list immediately (optimistic update)
        if (data.data?.eventId) {
          // Refetch para obtener el evento completo con todos los datos
          fetchEvents();
        } else if (data.data?.event) {
          setEvents((prevEvents) => [data.data.event, ...prevEvents]);
        } else {
          // Si no viene el evento, refrescar la lista
          fetchEvents();
        }

        // Reset form
        setFormData({
          titulo: "",
          descripcion: "",
          tipo_evento: "",
          fecha_evento: "",
          hora_inicio: "",
          hora_fin: "",
          ubicacion: "",
          numero_invitados: "",
          cliente_nombre: "",
          cliente_email: "",
          cliente_telefono: "",
          presupuesto_total: "",
        });

        // Close modal after 1 second
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setSubmitSuccess(false);
        }, 1000);
      } else {
        const errorMessage = data.message || "Error al crear el evento";
        setSubmitError(errorMessage);
        showApiError(toast, errorMessage, "Error al crear el evento");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      const errorMessage =
        "Error al crear el evento. Por favor, inténtalo de nuevo.";
      setSubmitError(errorMessage);
      showApiError(toast, error, errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.titulo.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      event.cliente_nombre
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      event.tipo_evento
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchEvents();
  }, [estado]);

  // Refetch cuando cambia el término de búsqueda debounced
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      // El debounce está activo, no hacer nada aún
      return;
    }
    // Si el término de búsqueda cambió y ya está debounced, podríamos refetch
    // Pero por ahora solo filtramos en el cliente
  }, [debouncedSearchTerm, searchTerm]);

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
          <Button onClick={() => setIsCreateModalOpen(true)}>
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
              <SelectItem value="all">Todos los estados</SelectItem>
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
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
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
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/events/${selectedEvent.id}/assign-workers`}>
                        <Users className="h-4 w-4 mr-2" />
                        Asignar Trabajadores
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/events/${selectedEvent.id}/applications`}>
                        <Users className="h-4 w-4 mr-2" />
                        Ver Postulaciones
                      </a>
                    </Button>
                    {(selectedEvent.estado === "completado" ||
                      selectedEvent.estado === "en_progreso") && (
                      <>
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/events/${selectedEvent.id}/rate`}>
                            <Star className="h-4 w-4 mr-2" />
                            Calificar Trabajadores
                          </a>
                        </Button>
                        <Button size="sm" variant="destructive" asChild>
                          <a
                            href={`/events/${selectedEvent.id}/report-incident`}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Reportar Incidencia
                          </a>
                        </Button>
                      </>
                    )}
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

      {/* Modal de Creación de Evento */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Evento</DialogTitle>
            <DialogDescription>
              Completa el formulario para crear un nuevo evento en el sistema
            </DialogDescription>
          </DialogHeader>

          {submitSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Evento creado exitosamente
              </AlertDescription>
            </Alert>
          )}

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateEvent}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="titulo">Título del Evento *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  placeholder="Ej: Boda de Verano"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_evento">Tipo de Evento *</Label>
                <Select
                  value={formData.tipo_evento}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_evento: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boda">Boda</SelectItem>
                    <SelectItem value="Corporativo">Corporativo</SelectItem>
                    <SelectItem value="Cumpleaños">Cumpleaños</SelectItem>
                    <SelectItem value="Quinceañera">Quinceañera</SelectItem>
                    <SelectItem value="Aniversario">Aniversario</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_evento">Fecha del Evento *</Label>
                <Input
                  id="fecha_evento"
                  type="date"
                  value={formData.fecha_evento}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_evento: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora_inicio">Hora de Inicio</Label>
                <Input
                  id="hora_inicio"
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, hora_inicio: e.target.value })
                  }
                  placeholder="16:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora_fin">Hora de Fin</Label>
                <Input
                  id="hora_fin"
                  type="time"
                  value={formData.hora_fin}
                  onChange={(e) =>
                    setFormData({ ...formData, hora_fin: e.target.value })
                  }
                  placeholder="23:00"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="ubicacion">Ubicación *</Label>
                <Input
                  id="ubicacion"
                  value={formData.ubicacion}
                  onChange={(e) =>
                    setFormData({ ...formData, ubicacion: e.target.value })
                  }
                  placeholder="Ej: Jardín Botánico, Calle Principal 123"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_invitados">Número de Invitados *</Label>
                <Input
                  id="numero_invitados"
                  type="number"
                  min="1"
                  value={formData.numero_invitados}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numero_invitados: e.target.value,
                    })
                  }
                  placeholder="150"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presupuesto_total">Presupuesto Total</Label>
                <Input
                  id="presupuesto_total"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.presupuesto_total}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      presupuesto_total: e.target.value,
                    })
                  }
                  placeholder="25000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente_nombre">Nombre del Cliente *</Label>
                <Input
                  id="cliente_nombre"
                  value={formData.cliente_nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, cliente_nombre: e.target.value })
                  }
                  placeholder="María González"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente_email">Email del Cliente *</Label>
                <Input
                  id="cliente_email"
                  type="email"
                  value={formData.cliente_email}
                  onChange={(e) =>
                    setFormData({ ...formData, cliente_email: e.target.value })
                  }
                  placeholder="maria.gonzalez@ejemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente_telefono">Teléfono del Cliente</Label>
                <Input
                  id="cliente_telefono"
                  type="tel"
                  value={formData.cliente_telefono}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cliente_telefono: e.target.value,
                    })
                  }
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  placeholder="Descripción detallada del evento..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setSubmitError("");
                  setSubmitSuccess(false);
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isSubmitting ? "Creando..." : "Crear Evento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
