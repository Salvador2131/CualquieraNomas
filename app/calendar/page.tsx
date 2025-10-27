"use client";

import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  event_type: string;
  priority: string;
  status: string;
  location?: string;
  attendees: any[];
  created_by_user?: {
    name: string;
    email: string;
  };
  event?: {
    titulo: string;
    fecha_evento: string;
  };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Simular datos de eventos del calendario
      const mockData: CalendarEvent[] = [
        {
          id: "1",
          title: "Reunión de Planificación - Boda Ana y Carlos",
          description: "Reunión para coordinar detalles del evento",
          start_date: "2024-01-20T10:00:00Z",
          end_date: "2024-01-20T11:00:00Z",
          all_day: false,
          event_type: "meeting",
          priority: "high",
          status: "scheduled",
          location: "Oficina Principal",
          attendees: [],
          created_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
          event: {
            titulo: "Boda de Ana y Carlos",
            fecha_evento: "2024-02-14",
          },
        },
        {
          id: "2",
          title: "Entrenamiento de Personal",
          description: "Capacitación en protocolos de servicio",
          start_date: "2024-01-22T09:00:00Z",
          end_date: "2024-01-22T17:00:00Z",
          all_day: true,
          event_type: "training",
          priority: "medium",
          status: "scheduled",
          location: "Centro de Capacitación",
          attendees: [],
          created_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
        },
        {
          id: "3",
          title: "Mantenimiento de Equipos",
          description: "Revisión y mantenimiento de equipos de cocina",
          start_date: "2024-01-25T08:00:00Z",
          end_date: "2024-01-25T12:00:00Z",
          all_day: false,
          event_type: "maintenance",
          priority: "low",
          status: "completed",
          location: "Cocina Principal",
          attendees: [],
          created_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
        },
      ];
      setEvents(mockData);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || event.event_type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || event.priority === priorityFilter;

    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      event: { variant: "default" as const, label: "Evento", icon: Calendar },
      meeting: { variant: "secondary" as const, label: "Reunión", icon: Users },
      reminder: {
        variant: "outline" as const,
        label: "Recordatorio",
        icon: Clock,
      },
      holiday: {
        variant: "default" as const,
        label: "Feriado",
        icon: Calendar,
      },
      maintenance: {
        variant: "secondary" as const,
        label: "Mantenimiento",
        icon: AlertCircle,
      },
      training: {
        variant: "outline" as const,
        label: "Entrenamiento",
        icon: Users,
      },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.event;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: {
        variant: "default" as const,
        label: "Programado",
        icon: Clock,
      },
      in_progress: {
        variant: "secondary" as const,
        label: "En Progreso",
        icon: Clock,
      },
      completed: {
        variant: "default" as const,
        label: "Completado",
        icon: CheckCircle,
      },
      cancelled: {
        variant: "destructive" as const,
        label: "Cancelado",
        icon: XCircle,
      },
      postponed: {
        variant: "outline" as const,
        label: "Pospuesto",
        icon: Clock,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: {
        variant: "outline" as const,
        label: "Baja",
        color: "text-gray-500",
      },
      medium: {
        variant: "secondary" as const,
        label: "Media",
        color: "text-blue-500",
      },
      high: {
        variant: "default" as const,
        label: "Alta",
        color: "text-orange-500",
      },
      urgent: {
        variant: "destructive" as const,
        label: "Urgente",
        color: "text-red-500",
      },
    };

    const config =
      priorityConfig[priority as keyof typeof priorityConfig] ||
      priorityConfig.medium;

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario</h1>
          <p className="text-muted-foreground">
            Gestiona eventos, reuniones y recordatorios
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programados</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter((e) => e.status === "scheduled").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter((e) => e.status === "completed").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter((e) => e.priority === "urgent").length}
            </div>
          </CardContent>
        </Card>
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
                  placeholder="Buscar por título o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="event">Evento</SelectItem>
                <SelectItem value="meeting">Reunión</SelectItem>
                <SelectItem value="reminder">Recordatorio</SelectItem>
                <SelectItem value="holiday">Feriado</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="training">Entrenamiento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="scheduled">Programado</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="postponed">Pospuesto</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Eventos del Calendario ({filteredEvents.length})
          </CardTitle>
          <CardDescription>
            Lista de todos los eventos programados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Creado por</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{event.title}</div>
                      {event.description && (
                        <div className="text-sm text-muted-foreground">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(event.event_type)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {formatDateTime(event.start_date)}
                      </div>
                      {!event.all_day && (
                        <div className="text-sm text-muted-foreground">
                          hasta {formatDateTime(event.end_date)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.location ? (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(event.status)}</TableCell>
                  <TableCell>{getPriorityBadge(event.priority)}</TableCell>
                  <TableCell>
                    {event.created_by_user ? (
                      <div>
                        <div className="font-medium">
                          {event.created_by_user.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.created_by_user.email}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEvents.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron eventos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
