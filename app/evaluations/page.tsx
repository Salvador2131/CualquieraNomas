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
  Star,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

interface Evaluation {
  id: string;
  type: "worker" | "event" | "client";
  score?: number;
  overall_rating?: number;
  comments?: string;
  created_at: string;
  worker?: {
    name: string;
    email: string;
  };
  event?: {
    titulo: string;
    fecha_evento: string;
  };
  evaluator?: {
    name: string;
    email: string;
  };
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      // Simular datos de evaluaciones
      const mockData: Evaluation[] = [
        {
          id: "1",
          type: "worker",
          score: 4,
          comments: "Excelente desempeño en el evento",
          created_at: "2024-01-15",
          worker: {
            name: "María González",
            email: "maria@ejemplo.com",
          },
          event: {
            titulo: "Boda de Ana y Carlos",
            fecha_evento: "2024-01-10",
          },
          evaluator: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
        },
        {
          id: "2",
          type: "event",
          overall_rating: 5,
          comments: "Evento muy bien organizado",
          created_at: "2024-01-14",
          event: {
            titulo: "Cumpleaños de 50 años",
            fecha_evento: "2024-01-12",
          },
          evaluator: {
            name: "Admin User",
            email: "admin@ejemplo.com",
          },
        },
        {
          id: "3",
          type: "client",
          overall_rating: 4,
          comments: "Muy satisfecho con el servicio",
          created_at: "2024-01-13",
          event: {
            titulo: "Graduación Universitaria",
            fecha_evento: "2024-01-08",
          },
        },
      ];
      setEvaluations(mockData);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch = evaluation.comments
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      evaluation.worker?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      evaluation.event?.titulo
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || evaluation.type === typeFilter;

    const matchesScore = scoreFilter === "all" ||
      (evaluation.score && evaluation.score >= parseInt(scoreFilter)) ||
      (evaluation.overall_rating && evaluation.overall_rating >= parseInt(scoreFilter));

    return matchesSearch && matchesType && matchesScore;
  });

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      worker: { variant: "default" as const, label: "Trabajador", icon: Users },
      event: { variant: "secondary" as const, label: "Evento", icon: Calendar },
      client: { variant: "outline" as const, label: "Cliente", icon: MessageSquare },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.worker;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getScoreStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < score ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando evaluaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evaluaciones</h1>
          <p className="text-muted-foreground">
            Gestiona evaluaciones de trabajadores, eventos y clientes
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Evaluación
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evaluations.length > 0
                ? (
                    evaluations.reduce((sum, e) => sum + (e.score || e.overall_rating || 0), 0) /
                    evaluations.length
                  ).toFixed(1)
                : "0.0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trabajadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evaluations.filter((e) => e.type === "worker").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evaluations.filter((e) => e.type === "event").length}
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
                  placeholder="Buscar por comentarios, trabajador o evento..."
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
                <SelectItem value="worker">Trabajador</SelectItem>
                <SelectItem value="event">Evento</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Puntuación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las puntuaciones</SelectItem>
                <SelectItem value="5">5 estrellas</SelectItem>
                <SelectItem value="4">4+ estrellas</SelectItem>
                <SelectItem value="3">3+ estrellas</SelectItem>
                <SelectItem value="2">2+ estrellas</SelectItem>
                <SelectItem value="1">1+ estrellas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluaciones ({filteredEvaluations.length})</CardTitle>
          <CardDescription>
            Lista de todas las evaluaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Evaluado</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Puntuación</TableHead>
                <TableHead>Comentarios</TableHead>
                <TableHead>Evaluador</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvaluations.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell>{getTypeBadge(evaluation.type)}</TableCell>
                  <TableCell>
                    {evaluation.type === "worker" && evaluation.worker ? (
                      <div>
                        <div className="font-medium">{evaluation.worker.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {evaluation.worker.email}
                        </div>
                      </div>
                    ) : evaluation.type === "client" ? (
                      <div>
                        <div className="font-medium">Cliente</div>
                        <div className="text-sm text-muted-foreground">
                          {evaluation.event?.titulo}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {evaluation.event ? (
                      <div>
                        <div className="font-medium">{evaluation.event.titulo}</div>
                        <div className="text-sm text-muted-foreground">
                          {evaluation.event.fecha_evento}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getScoreStars(evaluation.score || evaluation.overall_rating || 0)}
                      <span className="ml-2 text-sm font-medium">
                        {evaluation.score || evaluation.overall_rating || 0}/5
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {evaluation.comments || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {evaluation.evaluator ? (
                      <div>
                        <div className="font-medium">{evaluation.evaluator.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {evaluation.evaluator.email}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(evaluation.created_at).toLocaleDateString()}
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

          {filteredEvaluations.length === 0 && (
            <div className="text-center py-8">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron evaluaciones
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
