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
  FileText,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Download,
  Upload,
  Tag,
  MessageSquare,
  Clock,
  User,
  Calendar,
  Shield,
  Archive,
  Trash2,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  document_type: string;
  category: string;
  status: string;
  is_public: boolean;
  version: string;
  uploaded_by_user?: {
    name: string;
    email: string;
  };
  event?: {
    titulo: string;
    fecha_evento: string;
  };
  worker?: {
    name: string;
    email: string;
  };
  tags?: {
    id: string;
    tag_name: string;
    tag_color: string;
  }[];
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Simular datos de documentos
      const mockData: Document[] = [
        {
          id: "1",
          title: "Contrato de Servicio - Boda Ana y Carlos",
          description: "Contrato detallado para el evento del 14 de febrero",
          file_name: "contrato_boda_ana_carlos.pdf",
          file_type: "pdf",
          file_size: 2048000,
          document_type: "contract",
          category: "legal",
          status: "active",
          is_public: false,
          version: "1.0",
          uploaded_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
          event: {
            titulo: "Boda de Ana y Carlos",
            fecha_evento: "2024-02-14",
          },
          tags: [
            { id: "t1", tag_name: "Contrato", tag_color: "#3B82F6" },
            { id: "t2", tag_name: "Urgente", tag_color: "#EF4444" },
          ],
          created_at: "2024-01-15T10:30:00Z",
        },
        {
          id: "2",
          title: "Menú Final - Evento Corporativo",
          description: "Menú aprobado para evento corporativo de 200 personas",
          file_name: "menu_corporativo_final.pdf",
          file_type: "pdf",
          file_size: 1536000,
          document_type: "manual",
          category: "operational",
          status: "active",
          is_public: true,
          version: "2.1",
          uploaded_by_user: {
            name: "María González",
            email: "maria@ejemplo.com",
          },
          tags: [
            { id: "t3", tag_name: "Menú", tag_color: "#10B981" },
            { id: "t4", tag_name: "Aprobado", tag_color: "#059669" },
          ],
          created_at: "2024-01-14T15:45:00Z",
        },
        {
          id: "3",
          title: "Certificado de Manipulación de Alimentos",
          description: "Certificado vigente para el personal de cocina",
          file_name: "certificado_manipulacion_2024.pdf",
          file_type: "pdf",
          file_size: 1024000,
          document_type: "certificate",
          category: "hr",
          status: "active",
          is_public: false,
          version: "1.0",
          uploaded_by_user: {
            name: "Carlos Rodríguez",
            email: "carlos@ejemplo.com",
          },
          worker: {
            name: "Juan Pérez",
            email: "juan@ejemplo.com",
          },
          tags: [
            { id: "t5", tag_name: "Certificado", tag_color: "#F59E0B" },
            { id: "t6", tag_name: "Vigente", tag_color: "#10B981" },
          ],
          created_at: "2024-01-10T09:20:00Z",
        },
        {
          id: "4",
          title: "Manual de Procedimientos de Seguridad",
          description:
            "Manual actualizado de procedimientos de seguridad en eventos",
          file_name: "manual_seguridad_2024.pdf",
          file_type: "pdf",
          file_size: 5120000,
          document_type: "manual",
          category: "operational",
          status: "active",
          is_public: true,
          version: "3.2",
          uploaded_by_user: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
          tags: [
            { id: "t7", tag_name: "Manual", tag_color: "#6366F1" },
            { id: "t8", tag_name: "Seguridad", tag_color: "#EF4444" },
          ],
          created_at: "2024-01-08T14:15:00Z",
        },
      ];
      setDocuments(mockData);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((document) => {
    const matchesSearch =
      document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.file_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || document.document_type === typeFilter;
    const matchesCategory =
      categoryFilter === "all" || document.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || document.status === statusFilter;

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      contract: {
        variant: "default" as const,
        label: "Contrato",
        icon: FileText,
      },
      invoice: {
        variant: "secondary" as const,
        label: "Factura",
        icon: FileText,
      },
      receipt: { variant: "outline" as const, label: "Recibo", icon: FileText },
      certificate: {
        variant: "default" as const,
        label: "Certificado",
        icon: Shield,
      },
      manual: {
        variant: "secondary" as const,
        label: "Manual",
        icon: FileText,
      },
      template: {
        variant: "outline" as const,
        label: "Plantilla",
        icon: FileText,
      },
      report: { variant: "default" as const, label: "Reporte", icon: FileText },
      other: { variant: "outline" as const, label: "Otro", icon: FileText },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      legal: {
        variant: "default" as const,
        label: "Legal",
        color: "text-blue-600",
      },
      financial: {
        variant: "secondary" as const,
        label: "Financiero",
        color: "text-green-600",
      },
      operational: {
        variant: "outline" as const,
        label: "Operacional",
        color: "text-orange-600",
      },
      hr: {
        variant: "default" as const,
        label: "RRHH",
        color: "text-purple-600",
      },
      client: {
        variant: "secondary" as const,
        label: "Cliente",
        color: "text-pink-600",
      },
      event: {
        variant: "outline" as const,
        label: "Evento",
        color: "text-indigo-600",
      },
      training: {
        variant: "default" as const,
        label: "Entrenamiento",
        color: "text-cyan-600",
      },
      other: {
        variant: "outline" as const,
        label: "Otro",
        color: "text-gray-600",
      },
    };

    const config =
      categoryConfig[category as keyof typeof categoryConfig] ||
      categoryConfig.other;

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, label: "Activo", icon: Clock },
      archived: {
        variant: "secondary" as const,
        label: "Archivado",
        icon: Archive,
      },
      deleted: {
        variant: "destructive" as const,
        label: "Eliminado",
        icon: Trash2,
      },
      draft: { variant: "outline" as const, label: "Borrador", icon: Edit },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
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
          <p>Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">
            Gestiona archivos, contratos y documentos del sistema
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivo
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Documento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documentos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Públicos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.is_public).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamaño Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(
                documents.reduce((sum, d) => sum + d.file_size, 0)
              )}
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
                  placeholder="Buscar por título, descripción o nombre de archivo..."
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
                <SelectItem value="contract">Contrato</SelectItem>
                <SelectItem value="invoice">Factura</SelectItem>
                <SelectItem value="receipt">Recibo</SelectItem>
                <SelectItem value="certificate">Certificado</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="template">Plantilla</SelectItem>
                <SelectItem value="report">Reporte</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="financial">Financiero</SelectItem>
                <SelectItem value="operational">Operacional</SelectItem>
                <SelectItem value="hr">RRHH</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="event">Evento</SelectItem>
                <SelectItem value="training">Entrenamiento</SelectItem>
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
                <SelectItem value="archived">Archivado</SelectItem>
                <SelectItem value="deleted">Eliminado</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            Lista de todos los documentos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead>Subido por</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium truncate">
                        {document.title}
                      </div>
                      {document.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {document.description}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {document.file_name}
                      </div>
                      {document.tags && document.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {document.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs"
                              style={{ color: tag.tag_color }}
                            >
                              {tag.tag_name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(document.document_type)}</TableCell>
                  <TableCell>{getCategoryBadge(document.category)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{formatFileSize(document.file_size)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(document.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{document.version}</Badge>
                  </TableCell>
                  <TableCell>
                    {document.uploaded_by_user ? (
                      <div>
                        <div className="font-medium">
                          {document.uploaded_by_user.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {document.uploaded_by_user.email}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(document.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron documentos
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
