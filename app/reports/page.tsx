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
  BarChart3,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  FileText,
} from "lucide-react";

interface Report {
  id: string;
  report_type: string;
  title: string;
  description?: string;
  status: string;
  format: string;
  file_size?: number;
  created_at: string;
  generated_by_user?: {
    name: string;
    email: string;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Simular datos de reportes
      const mockData: Report[] = [
        {
          id: "1",
          report_type: "events",
          title: "Reporte de Eventos - Enero 2024",
          description: "Análisis completo de eventos del mes de enero",
          status: "completed",
          format: "pdf",
          file_size: 1024000,
          created_at: "2024-01-15",
          generated_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
        },
        {
          id: "2",
          report_type: "workers",
          title: "Reporte de Trabajadores - Q1 2024",
          description: "Evaluación de rendimiento de trabajadores",
          status: "completed",
          format: "excel",
          file_size: 512000,
          created_at: "2024-01-14",
          generated_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
        },
        {
          id: "3",
          report_type: "financial",
          title: "Reporte Financiero - Diciembre 2023",
          description: "Análisis de ingresos y gastos",
          status: "processing",
          format: "json",
          file_size: 256000,
          created_at: "2024-01-13",
          generated_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
        },
        {
          id: "4",
          report_type: "performance",
          title: "Reporte de Rendimiento - Semana 2",
          description: "Métricas de rendimiento del sistema",
          status: "failed",
          format: "csv",
          file_size: 0,
          created_at: "2024-01-12",
          generated_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
        },
      ];
      setReports(mockData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      report.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || report.report_type === typeFilter;
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      events: { variant: "default" as const, label: "Eventos", icon: Calendar },
      workers: { variant: "secondary" as const, label: "Trabajadores", icon: Users },
      financial: { variant: "outline" as const, label: "Financiero", icon: DollarSign },
      performance: { variant: "default" as const, label: "Rendimiento", icon: TrendingUp },
      client_satisfaction: { variant: "secondary" as const, label: "Satisfacción", icon: BarChart3 },
      custom: { variant: "outline" as const, label: "Personalizado", icon: FileText },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.custom;
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
      completed: { variant: "default" as const, label: "Completado" },
      processing: { variant: "secondary" as const, label: "Procesando" },
      failed: { variant: "destructive" as const, label: "Fallido" },
      pending: { variant: "outline" as const, label: "Pendiente" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Genera y gestiona reportes del sistema
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Reporte
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reportes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => r.status === "completed").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesando</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => r.status === "processing").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => r.status === "failed").length}
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
                <SelectItem value="events">Eventos</SelectItem>
                <SelectItem value="workers">Trabajadores</SelectItem>
                <SelectItem value="financial">Financiero</SelectItem>
                <SelectItem value="performance">Rendimiento</SelectItem>
                <SelectItem value="client_satisfaction">Satisfacción</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes ({filteredReports.length})</CardTitle>
          <CardDescription>
            Lista de todos los reportes generados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Generado por</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{getTypeBadge(report.report_type)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{report.title}</div>
                      {report.description && (
                        <div className="text-sm text-muted-foreground">
                          {report.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {report.format.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.file_size ? formatFileSize(report.file_size) : "-"}
                  </TableCell>
                  <TableCell>
                    {report.generated_by_user ? (
                      <div>
                        <div className="font-medium">
                          {report.generated_by_user.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {report.generated_by_user.email}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {report.status === "completed" && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron reportes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
