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
  Plug,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Play,
  Pause,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  integration_type: string;
  provider: string;
  status: string;
  configuration: any;
  webhook_url?: string;
  api_endpoint?: string;
  last_sync_at?: string;
  sync_frequency: number;
  created_by_user?: {
    name: string;
    email: string;
  };
  created_at: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  integration_id: string;
  created_at: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchIntegrations();
    fetchWebhooks();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      // Simular datos de integraciones
      const mockData: Integration[] = [
        {
          id: "1",
          name: "Stripe Payment Gateway",
          integration_type: "payment",
          provider: "Stripe",
          status: "active",
          configuration: {
            api_version: "2020-08-27",
            test_mode: true,
          },
          webhook_url: "https://api.ejemplo.com/webhooks/stripe",
          api_endpoint: "https://api.stripe.com/v1",
          last_sync_at: "2024-01-15T10:30:00Z",
          sync_frequency: 3600,
          created_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
          created_at: "2024-01-10T09:00:00Z",
        },
        {
          id: "2",
          name: "Google Calendar Sync",
          integration_type: "calendar",
          provider: "Google",
          status: "active",
          configuration: {
            api_version: "v3",
            calendar_id: "primary",
          },
          webhook_url: "https://api.ejemplo.com/webhooks/google-calendar",
          api_endpoint: "https://www.googleapis.com/calendar/v3",
          last_sync_at: "2024-01-15T09:15:00Z",
          sync_frequency: 1800,
          created_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
          created_at: "2024-01-08T14:30:00Z",
        },
        {
          id: "3",
          name: "SendGrid Email Service",
          integration_type: "email",
          provider: "SendGrid",
          status: "error",
          configuration: {
            api_version: "v3",
            from_email: "noreply@ejemplo.com",
          },
          api_endpoint: "https://api.sendgrid.com/v3/mail/send",
          last_sync_at: "2024-01-14T16:45:00Z",
          sync_frequency: 7200,
          created_by_user: {
            name: "María González",
            email: "maria@ejemplo.com",
          },
          created_at: "2024-01-05T11:20:00Z",
        },
        {
          id: "4",
          name: "Twilio SMS Service",
          integration_type: "sms",
          provider: "Twilio",
          status: "inactive",
          configuration: {
            api_version: "2010-04-01",
            phone_number: "+1234567890",
          },
          api_endpoint:
            "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json",
          created_by_user: {
            name: "Carlos Rodríguez",
            email: "carlos@ejemplo.com",
          },
          created_at: "2024-01-03T08:45:00Z",
        },
      ];
      setIntegrations(mockData);
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    try {
      // Simular datos de webhooks
      const mockData: Webhook[] = [
        {
          id: "1",
          name: "Stripe Payment Webhook",
          url: "https://api.ejemplo.com/webhooks/stripe",
          events: ["payment_intent.succeeded", "payment_intent.payment_failed"],
          is_active: true,
          retry_count: 3,
          timeout_seconds: 30,
          integration_id: "1",
          created_at: "2024-01-10T09:00:00Z",
        },
        {
          id: "2",
          name: "Google Calendar Webhook",
          url: "https://api.ejemplo.com/webhooks/google-calendar",
          events: ["calendar.event.created", "calendar.event.updated"],
          is_active: true,
          retry_count: 3,
          timeout_seconds: 30,
          integration_id: "2",
          created_at: "2024-01-08T14:30:00Z",
        },
        {
          id: "3",
          name: "SendGrid Email Webhook",
          url: "https://api.ejemplo.com/webhooks/sendgrid",
          events: ["email.delivered", "email.bounced"],
          is_active: false,
          retry_count: 5,
          timeout_seconds: 45,
          integration_id: "3",
          created_at: "2024-01-05T11:20:00Z",
        },
      ];
      setWebhooks(mockData);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
    }
  };

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.provider.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || integration.integration_type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || integration.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      payment: {
        variant: "default" as const,
        label: "Pago",
        icon: Zap,
        color: "text-green-600",
      },
      calendar: {
        variant: "secondary" as const,
        label: "Calendario",
        icon: Clock,
        color: "text-blue-600",
      },
      email: {
        variant: "outline" as const,
        label: "Email",
        icon: Activity,
        color: "text-purple-600",
      },
      sms: {
        variant: "default" as const,
        label: "SMS",
        icon: Activity,
        color: "text-orange-600",
      },
      storage: {
        variant: "secondary" as const,
        label: "Almacenamiento",
        icon: Shield,
        color: "text-indigo-600",
      },
      crm: {
        variant: "outline" as const,
        label: "CRM",
        icon: Activity,
        color: "text-pink-600",
      },
      accounting: {
        variant: "default" as const,
        label: "Contabilidad",
        icon: Activity,
        color: "text-cyan-600",
      },
      other: {
        variant: "outline" as const,
        label: "Otro",
        icon: Plug,
        color: "text-gray-600",
      },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    const Icon = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={`flex items-center space-x-1 ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        variant: "default" as const,
        label: "Activo",
        icon: CheckCircle,
        color: "text-green-600",
      },
      inactive: {
        variant: "secondary" as const,
        label: "Inactivo",
        icon: Pause,
        color: "text-gray-600",
      },
      error: {
        variant: "destructive" as const,
        label: "Error",
        icon: XCircle,
        color: "text-red-600",
      },
      maintenance: {
        variant: "outline" as const,
        label: "Mantenimiento",
        icon: AlertCircle,
        color: "text-yellow-600",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.inactive;
    const Icon = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={`flex items-center space-x-1 ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
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

  const formatSyncFrequency = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando integraciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integraciones</h1>
          <p className="text-muted-foreground">
            Gestiona integraciones externas y webhooks
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Integración
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Integraciones
            </CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter((i) => i.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Errores</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter((i) => i.status === "error").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.length}</div>
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
                  placeholder="Buscar por nombre o proveedor..."
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
                <SelectItem value="payment">Pago</SelectItem>
                <SelectItem value="calendar">Calendario</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="storage">Almacenamiento</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="accounting">Contabilidad</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Integrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Integraciones ({filteredIntegrations.length})</CardTitle>
          <CardDescription>
            Lista de todas las integraciones configuradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Integración</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Sincronización</TableHead>
                <TableHead>Última Sincronización</TableHead>
                <TableHead>Creado por</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIntegrations.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{integration.name}</div>
                      {integration.webhook_url && (
                        <div className="text-sm text-muted-foreground">
                          Webhook: {integration.webhook_url}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(integration.integration_type)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{integration.provider}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(integration.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatSyncFrequency(integration.sync_frequency)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {integration.last_sync_at ? (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateTime(integration.last_sync_at)}</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Nunca</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {integration.created_by_user ? (
                      <div>
                        <div className="font-medium">
                          {integration.created_by_user.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {integration.created_by_user.email}
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
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredIntegrations.length === 0 && (
            <div className="text-center py-8">
              <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron integraciones
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhooks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks ({webhooks.length})</CardTitle>
          <CardDescription>
            Lista de todos los webhooks configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Reintentos</TableHead>
                <TableHead>Timeout</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>
                    <div className="font-medium">{webhook.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-muted-foreground">
                      {webhook.url}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 2).map((event, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {event}
                        </Badge>
                      ))}
                      {webhook.events.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{webhook.events.length - 2} más
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={webhook.is_active ? "default" : "secondary"}
                    >
                      {webhook.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span>{webhook.retry_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{webhook.timeout_seconds}s</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        {webhook.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {webhooks.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron webhooks
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
