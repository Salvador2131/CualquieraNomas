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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Calendar,
  Users,
  DollarSign,
  Eye,
  Search,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";

interface Service {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Quote {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  base_price: number;
  services: Service[];
  subtotal: number;
  taxes: number;
  total: number;
  expiration_date: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  notes?: string;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  draft: { label: "Borrador", color: "bg-gray-100 text-gray-800" },
  sent: { label: "Enviada", color: "bg-blue-100 text-blue-800" },
  accepted: { label: "Aceptada", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rechazada", color: "bg-red-100 text-red-800" },
  expired: { label: "Expirada", color: "bg-yellow-100 text-yellow-800" },
};

const eventTypeLabels: Record<string, string> = {
  wedding: "Boda",
  corporate: "Corporativo",
  party: "Fiesta",
  conference: "Conferencia",
  other: "Otro",
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const fetchQuotes = async () => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/quotes?${params.toString()}&t=${Date.now()}`
      );
      const data = await response.json();

      console.log("Quotes API Response:", data);

      if (response.ok && data.success) {
        const quotesData = data.data?.quotes || data.quotes || [];
        console.log("Quotes from API:", quotesData);
        setQuotes(quotesData);
      } else {
        throw new Error(data.message || "Error al cargar las cotizaciones");
      }
    } catch (err) {
      console.error("Error fetching quotes:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setQuotes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuotes();
  };

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Cotizaciones</h2>
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto space-y-4 p-8 pt-6 max-w-7xl">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cotizaciones</h2>
            <p className="text-muted-foreground">
              Visualiza y gestiona todas las cotizaciones realizadas
            </p>
          </div>
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

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Cotizaciones
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotes.length}</div>
              <p className="text-xs text-muted-foreground">
                {quotes.filter((q) => q.status === "sent").length} enviadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aceptadas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotes.filter((q) => q.status === "accepted").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Cotizaciones aceptadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Estimado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {quotes
                  .reduce((sum, quote) => sum + quote.total, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                En todas las cotizaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Borradores</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotes.filter((q) => q.status === "draft").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Pendientes de enviar
              </p>
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
                placeholder="Buscar por cliente o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="status">Estado</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla de Cotizaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Cotizaciones</CardTitle>
            <CardDescription>
              {filteredQuotes.length} cotizaciones encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo de Evento</TableHead>
                  <TableHead>Fecha del Evento</TableHead>
                  <TableHead>Invitados</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No se encontraron cotizaciones
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quote.client_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {quote.client_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {eventTypeLabels[quote.event_type] || quote.event_type}
                      </TableCell>
                      <TableCell>
                        {new Date(quote.event_date).toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell>{quote.guest_count}</TableCell>
                      <TableCell className="font-medium">
                        ${quote.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusConfig[quote.status]?.color ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {statusConfig[quote.status]?.label || quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedQuote(quote)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal de Detalles */}
        {selectedQuote && (
          <Dialog
            open={!!selectedQuote}
            onOpenChange={() => setSelectedQuote(null)}
          >
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detalles de la Cotización</DialogTitle>
                <DialogDescription>
                  Información completa de la cotización #{selectedQuote.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Información del Cliente */}
                <div>
                  <h3 className="font-semibold mb-3">
                    Información del Cliente
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Nombre:</strong> {selectedQuote.client_name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Email:</strong> {selectedQuote.client_email}
                      </span>
                    </div>
                    {selectedQuote.client_phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          <strong>Teléfono:</strong>{" "}
                          {selectedQuote.client_phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del Evento */}
                <div>
                  <h3 className="font-semibold mb-3">Información del Evento</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Tipo:</strong>{" "}
                        {eventTypeLabels[selectedQuote.event_type] ||
                          selectedQuote.event_type}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Fecha:</strong>{" "}
                        {new Date(selectedQuote.event_date).toLocaleDateString(
                          "es-MX"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        <strong>Invitados:</strong> {selectedQuote.guest_count}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Servicios */}
                {selectedQuote.services &&
                  selectedQuote.services.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">
                        Servicios Incluidos
                      </h3>
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Servicio</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Precio Unitario</TableHead>
                              <TableHead className="text-right">
                                Total
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedQuote.services.map((service, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {service.name}
                                    </div>
                                    {service.description && (
                                      <div className="text-sm text-muted-foreground">
                                        {service.description}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{service.quantity}</TableCell>
                                <TableCell>
                                  ${service.unit_price.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  ${service.total.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                {/* Resumen Financiero */}
                <div>
                  <h3 className="font-semibold mb-3">Resumen Financiero</h3>
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Precio Base:</span>
                      <span>${selectedQuote.base_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        ${selectedQuote.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Impuestos:</span>
                      <span>${selectedQuote.taxes.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span>${selectedQuote.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {selectedQuote.notes && (
                  <div>
                    <h3 className="font-semibold mb-3">Notas</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {selectedQuote.notes}
                    </p>
                  </div>
                )}

                {/* Información Adicional */}
                <div className="text-sm text-muted-foreground border-t pt-4">
                  <div className="flex justify-between">
                    <span>Estado:</span>
                    <Badge
                      className={
                        statusConfig[selectedQuote.status]?.color ||
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {statusConfig[selectedQuote.status]?.label ||
                        selectedQuote.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Fecha de Expiración:</span>
                    <span>
                      {new Date(
                        selectedQuote.expiration_date
                      ).toLocaleDateString("es-MX")}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Fecha de Creación:</span>
                    <span>
                      {new Date(selectedQuote.created_at).toLocaleDateString(
                        "es-MX"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
