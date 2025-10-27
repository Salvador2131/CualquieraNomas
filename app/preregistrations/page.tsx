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
import { Textarea } from "@/components/ui/textarea";
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
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Users,
  DollarSign,
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react";

interface Preregistration {
  id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  empresa?: string;
  tipo_evento: string;
  fecha_estimada: string;
  numero_invitados: number;
  ubicacion: string;
  servicios_requeridos: string[];
  presupuesto_estimado?: number;
  comentarios_adicionales?: string;
  fecha_solicitud: string;
  estado: "pendiente" | "en_revision" | "aprobado" | "rechazado";
  id_administrador_asignado?: string;
  historial_comentarios: any[];
  administrador?: {
    name: string;
    email: string;
  };
}

const estados = [
  {
    value: "pendiente",
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "en_revision",
    label: "En Revisión",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "aprobado",
    label: "Aprobado",
    color: "bg-green-100 text-green-800",
  },
  { value: "rechazado", label: "Rechazado", color: "bg-red-100 text-red-800" },
];

export default function PreregistrationsPage() {
  const [preregistrations, setPreregistrations] = useState<Preregistration[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPreregistration, setSelectedPreregistration] =
    useState<Preregistration | null>(null);
  const [estado, setEstado] = useState("pendiente");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const fetchPreregistrations = async () => {
    try {
      const response = await fetch(`/api/preregister?estado=${estado}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar las solicitudes");
      }

      setPreregistrations(data.preregistrations || []);
    } catch (err) {
      console.error("Error fetching preregistrations:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPreregistrations();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/preregister/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado");
      }

      // Actualizar la lista local
      setPreregistrations((prev) =>
        prev.map((prereg) =>
          prereg.id === id ? { ...prereg, estado: newStatus as any } : prereg
        )
      );

      // Si hay una solicitud seleccionada, actualizarla también
      if (selectedPreregistration?.id === id) {
        setSelectedPreregistration((prev) =>
          prev ? { ...prev, estado: newStatus as any } : null
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError(
        err instanceof Error ? err.message : "Error al actualizar el estado"
      );
    }
  };

  const filteredPreregistrations = preregistrations.filter(
    (prereg) =>
      prereg.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prereg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prereg.tipo_evento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchPreregistrations();
  }, [estado]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Preregistros</h2>
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
          <h2 className="text-3xl font-bold tracking-tight">Preregistros</h2>
          <p className="text-muted-foreground">
            Gestiona las solicitudes de eventos
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
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar por nombre, email o tipo de evento..."
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
        {/* Lista de Preregistros */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Solicitudes de Eventos</CardTitle>
            <CardDescription>
              {filteredPreregistrations.length} solicitudes encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPreregistrations.map((prereg) => (
                  <TableRow key={prereg.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {prereg.nombre_completo}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {prereg.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prereg.tipo_evento}</div>
                        <div className="text-sm text-muted-foreground">
                          {prereg.numero_invitados} invitados
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(prereg.fecha_estimada).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          estados.find((e) => e.value === prereg.estado)?.color
                        }
                      >
                        {estados.find((e) => e.value === prereg.estado)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPreregistration(prereg)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detalles del Preregistro Seleccionado */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Detalles de la Solicitud</CardTitle>
            <CardDescription>
              {selectedPreregistration
                ? "Información completa del preregistro"
                : "Selecciona una solicitud para ver los detalles"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPreregistration ? (
              <div className="space-y-6">
                {/* Información de Contacto */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Información de Contacto
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedPreregistration.nombre_completo}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedPreregistration.email}</span>
                    </div>
                    {selectedPreregistration.telefono && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{selectedPreregistration.telefono}</span>
                      </div>
                    )}
                    {selectedPreregistration.empresa && (
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{selectedPreregistration.empresa}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalles del Evento */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Detalles del Evento
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Tipo:</strong>{" "}
                        {selectedPreregistration.tipo_evento}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Fecha:</strong>{" "}
                        {new Date(
                          selectedPreregistration.fecha_estimada
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Invitados:</strong>{" "}
                        {selectedPreregistration.numero_invitados}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Ubicación:</strong>{" "}
                        {selectedPreregistration.ubicacion}
                      </span>
                    </div>
                    {selectedPreregistration.presupuesto_estimado && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          <strong>Presupuesto:</strong> $
                          {selectedPreregistration.presupuesto_estimado.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Servicios Requeridos */}
                {selectedPreregistration.servicios_requeridos.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Servicios Requeridos</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPreregistration.servicios_requeridos.map(
                        (service) => (
                          <Badge key={service} variant="secondary">
                            {service}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Comentarios */}
                {selectedPreregistration.comentarios_adicionales && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comentarios Adicionales
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPreregistration.comentarios_adicionales}
                    </p>
                  </div>
                )}

                {/* Acciones */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Acciones</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPreregistration.estado === "pendiente" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(
                              selectedPreregistration.id,
                              "en_revision"
                            )
                          }
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          En Revisión
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(
                              selectedPreregistration.id,
                              "aprobado"
                            )
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleStatusChange(
                              selectedPreregistration.id,
                              "rechazado"
                            )
                          }
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      </>
                    )}
                    {selectedPreregistration.estado === "en_revision" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(
                              selectedPreregistration.id,
                              "aprobado"
                            )
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleStatusChange(
                              selectedPreregistration.id,
                              "rechazado"
                            )
                          }
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Selecciona una solicitud para ver los detalles
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
