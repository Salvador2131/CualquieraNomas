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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  Upload,
  FileText,
} from "lucide-react";
import { WorkerBadges } from "@/components/worker-badges";
import Link from "next/link";

interface Worker {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  experience_years: number;
  hourly_rate: number;
  skills: string[];
  created_at: string;
  rating?: number;
  badges?: string[];
  users?: {
    name: string;
    email: string;
  };
}

export default function WorkersPage() {
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [minRatingFilter, setMinRatingFilter] = useState("all");
  const [hasCertifiedFilter, setHasCertifiedFilter] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    experience_years: "",
    hourly_rate: "",
    skills: "",
    address: "",
  });

  useEffect(() => {
    fetchWorkers();
  }, [debouncedSearchTerm, minRatingFilter, hasCertifiedFilter, roleFilter]);

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const workerData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        position: formData.position,
        experience_years: parseInt(formData.experience_years) || 0,
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        address: formData.address || undefined,
      };

      const response = await fetch("/api/workers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workerData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess(true);
        // Reset form
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          position: "",
          experience_years: "",
          hourly_rate: "",
          skills: "",
          address: "",
        });
        // Refresh workers list inmediatamente
        fetchWorkers();
        // Cerrar modal después de un breve delay
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setSubmitSuccess(false);
        }, 1500);
      } else {
        setSubmitError(data.message || "Error al crear trabajador");
      }
    } catch (error) {
      setSubmitError("Error de conexión. Por favor intenta nuevamente.");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportCSV = async () => {
    if (!selectedFile) {
      setImportError("Error en el archivo");
      return;
    }

    setIsImporting(true);
    setImportError("");
    setImportSuccess(false);

    try {
      const text = await selectedFile.text();
      const lines = text.split("\n").filter((line) => line.trim());

      // Validar formato básico (pero no mostrar detalles específicos)
      if (lines.length < 2) {
        setImportError("Error en el archivo");
        setIsImporting(false);
        return;
      }

      // Intentar parsear el CSV
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      // Validar que tenga columnas requeridas mínimas (pero no mostrar qué falta)
      const requiredColumns = ["nombre", "email", "cargo"];
      const hasRequiredColumns = requiredColumns.some((col) =>
        headers.some((h) => h.includes(col))
      );

      if (!hasRequiredColumns) {
        setImportError("Error en el archivo");
        setIsImporting(false);
        return;
      }

      // Procesar cada línea
      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(",").map((v) => v.trim());

        // Intentar crear trabajador (sin validar email duplicado como se requiere)
        try {
          const workerData = {
            first_name: values[0] || "",
            last_name: values[1] || "",
            email: values[2] || "",
            phone: values[3] || "",
            position: values[4] || "garzon",
            experience_years: values[5] ? parseInt(values[5]) || 0 : 0,
            hourly_rate: values[6] ? parseFloat(values[6]) || 0 : 0,
            skills: values[7] ? values[7].split(";").map((s) => s.trim()) : [],
            address: values[8] || "",
          };

          // Validar campos mínimos (pero mostrar error genérico)
          if (
            !workerData.first_name ||
            !workerData.email ||
            !workerData.position
          ) {
            errorCount++;
            continue;
          }

          const response = await fetch("/api/workers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(workerData),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (errorCount > 0 && successCount === 0) {
        const errorMessage = "Error en el archivo";
        setImportError(errorMessage);
        showApiError(toast, errorMessage, "Error al importar trabajadores");
      } else {
        setImportSuccess(true);
        setSelectedFile(null);
        showSuccess(
          toast,
          `Importación completada`,
          `${successCount} trabajador(es) importado(s)${
            errorCount > 0 ? `, ${errorCount} error(es)` : ""
          }`
        );
        await fetchWorkers();
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportSuccess(false);
        }, 2000);
      }
    } catch (error) {
      const errorMessage = "Error en el archivo";
      setImportError(errorMessage);
      showApiError(toast, error, errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        setImportError("Error en el archivo");
        return;
      }
      setSelectedFile(file);
      setImportError("");
      setImportSuccess(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      setLoading(true);

      // Si hay filtros avanzados, usar búsqueda avanzada
      const hasAdvancedFilters =
        minRatingFilter !== "all" || hasCertifiedFilter;

      if (hasAdvancedFilters) {
        // Construir query params para búsqueda avanzada
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (minRatingFilter !== "all")
          params.append("minRating", minRatingFilter);
        if (hasCertifiedFilter) params.append("hasCertified", "true");
        if (roleFilter !== "all") params.append("specialization", roleFilter);

        const response = await fetch(
          `/api/workers/search?${params.toString()}`
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setWorkers(data.workers || []);
        } else {
          const errorMessage = data.message || "Error al cargar trabajadores";
          console.error("Error fetching workers:", errorMessage);
          setWorkers([]);
          if (!loading) {
            showApiError(toast, errorMessage, "Error al cargar trabajadores");
          }
        }
      } else {
        // Búsqueda normal
        const response = await fetch(`/api/workers?t=${Date.now()}`);
        const data = await response.json();

        if (response.ok && data.success) {
          const workersData = data.data?.workers || data.workers || [];
          // Obtener badges para cada trabajador
          const workersWithBadges = await Promise.all(
            workersData.map(async (worker: any) => {
              try {
                const badgesResponse = await fetch(
                  `/api/workers/${worker.id}/badges`
                );
                const badgesData = await badgesResponse.json();
                return {
                  ...worker,
                  rating: worker.rating || 0,
                  badges: badgesData.success ? badgesData.badges : [],
                };
              } catch {
                return {
                  ...worker,
                  rating: worker.rating || 0,
                  badges: [],
                };
              }
            })
          );
          setWorkers(workersWithBadges);
        } else {
          console.error(
            "Error fetching workers:",
            data.message || "Unknown error"
          );
          setWorkers([]);
        }
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || worker.status === statusFilter;
    const matchesRole = roleFilter === "all" || worker.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, label: "Activo" },
      inactive: { variant: "secondary" as const, label: "Inactivo" },
      suspended: { variant: "destructive" as const, label: "Suspendido" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleIcon = (role: string) => {
    const roleIcons = {
      garzon: Users,
      bartender: Users,
      cocinero: Users,
      supervisor: Users,
      coordinador: Users,
    };

    const Icon = roleIcons[role as keyof typeof roleIcons] || Users;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Trabajadores</h1>
          <p className="text-muted-foreground">
            Administra el personal y sus asignaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Trabajador
          </Button>
        </div>
      </div>

      {/* Create Worker Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Trabajador</DialogTitle>
            <DialogDescription>
              Completa el formulario para registrar un nuevo trabajador en el
              sistema
            </DialogDescription>
          </DialogHeader>

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {submitSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Trabajador registrado exitosamente!
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateWorker}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="Juan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="juan.perez@ejemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Posición/Rol *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) =>
                    setFormData({ ...formData, position: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar posición" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="garzon">Garzón</SelectItem>
                    <SelectItem value="bartender">Bartender</SelectItem>
                    <SelectItem value="cocinero">Cocinero</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="coordinador">Coordinador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_years">Años de Experiencia *</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience_years: e.target.value,
                    })
                  }
                  placeholder="5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Tarifa por Hora ($) *</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                  placeholder="15.00"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="skills">
                  Habilidades (separadas por comas)
                </Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData({ ...formData, skills: e.target.value })
                  }
                  placeholder="Atención al cliente, Trabajo en equipo, Servicio de mesas"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Dirección completa del trabajador"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar Trabajador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Trabajadores
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.filter((w) => w.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promedio Experiencia
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.length > 0
                ? Math.round(
                    workers.reduce((sum, w) => sum + w.experience_years, 0) /
                      workers.length
                  )
                : 0}{" "}
              años
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tarifa Promedio
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {workers.length > 0
                ? Math.round(
                    workers.reduce((sum, w) => sum + w.hourly_rate, 0) /
                      workers.length
                  )
                : 0}
              /h
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
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="garzon">Garzón</SelectItem>
                <SelectItem value="bartender">Bartender</SelectItem>
                <SelectItem value="cocinero">Cocinero</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="coordinador">Coordinador</SelectItem>
              </SelectContent>
            </Select>
            <Select value={minRatingFilter} onValueChange={setMinRatingFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Rating mínimo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los ratings</SelectItem>
                <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                <SelectItem value="4.0">4.0+ estrellas</SelectItem>
                <SelectItem value="3.5">3.5+ estrellas</SelectItem>
                <SelectItem value="3.0">3.0+ estrellas</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="certified-filter"
                checked={hasCertifiedFilter}
                onChange={(e) => setHasCertifiedFilter(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="certified-filter" className="cursor-pointer">
                Solo certificados
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trabajadores ({filteredWorkers.length})</CardTitle>
          <CardDescription>
            Lista de todos los trabajadores del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabajador</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Experiencia</TableHead>
                <TableHead>Tarifa</TableHead>
                <TableHead>Habilidades</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{worker.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {worker.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(worker.role)}
                      <span className="capitalize">{worker.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {worker.rating !== undefined && worker.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {worker.rating.toFixed(1)}/5
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Sin calificaciones
                        </span>
                      )}
                      {worker.badges && worker.badges.length > 0 && (
                        <WorkerBadges badges={worker.badges} className="mt-1" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(worker.status)}</TableCell>
                  <TableCell>{worker.experience_years} años</TableCell>
                  <TableCell>${worker.hourly_rate}/h</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.slice(0, 2).map((skill, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {worker.skills.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{worker.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/workers/${worker.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredWorkers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron trabajadores
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import CSV Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Trabajadores desde CSV</DialogTitle>
            <DialogDescription>
              Selecciona un archivo CSV con los datos de los trabajadores a
              importar. El formato debe incluir: nombre, apellido, email,
              teléfono, cargo, años de experiencia, tarifa por hora, habilidades
              y dirección.
            </DialogDescription>
          </DialogHeader>

          {importError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}

          {importSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Trabajadores importados exitosamente
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Archivo CSV</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isImporting}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{selectedFile.name}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formato esperado: nombre, apellido, email, teléfono, cargo,
                años_experiencia, tarifa_hora, habilidades, dirección
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportModalOpen(false);
                setSelectedFile(null);
                setImportError("");
                setImportSuccess(false);
              }}
              disabled={isImporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImportCSV}
              disabled={!selectedFile || isImporting}
            >
              {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isImporting ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
