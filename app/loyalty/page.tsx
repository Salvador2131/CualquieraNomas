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
  Gift,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Trophy,
  Award,
  TrendingUp,
  Users,
} from "lucide-react";

interface WorkerLoyalty {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_email: string;
  total_points: number;
  current_level: string;
  events_completed: number;
  penalties_count: number;
  last_activity: string;
  status: string;
}

export default function LoyaltyPage() {
  const [workers, setWorkers] = useState<WorkerLoyalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  useEffect(() => {
    fetchWorkersLoyalty();
  }, []);

  const fetchWorkersLoyalty = async () => {
    try {
      setLoading(true);
      // Simular datos de fidelidad
      const mockData: WorkerLoyalty[] = [
        {
          id: "1",
          worker_id: "w1",
          worker_name: "María González",
          worker_email: "maria@ejemplo.com",
          total_points: 1250,
          current_level: "gold",
          events_completed: 25,
          penalties_count: 1,
          last_activity: "2024-01-15",
          status: "active",
        },
        {
          id: "2",
          worker_id: "w2",
          worker_name: "Carlos Rodríguez",
          worker_email: "carlos@ejemplo.com",
          total_points: 850,
          current_level: "silver",
          events_completed: 18,
          penalties_count: 0,
          last_activity: "2024-01-14",
          status: "active",
        },
        {
          id: "3",
          worker_id: "w3",
          worker_name: "Ana Martínez",
          worker_email: "ana@ejemplo.com",
          total_points: 2100,
          current_level: "platinum",
          events_completed: 42,
          penalties_count: 0,
          last_activity: "2024-01-16",
          status: "active",
        },
      ];
      setWorkers(mockData);
    } catch (error) {
      console.error("Error fetching workers loyalty:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.worker_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel =
      levelFilter === "all" || worker.current_level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const getLevelBadge = (level: string) => {
    const levelConfig = {
      bronze: { variant: "secondary" as const, label: "Bronce", icon: Award },
      silver: { variant: "default" as const, label: "Plata", icon: Award },
      gold: { variant: "default" as const, label: "Oro", icon: Trophy },
      platinum: { variant: "default" as const, label: "Platino", icon: Trophy },
    };

    const config =
      levelConfig[level as keyof typeof levelConfig] || levelConfig.bronze;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getLevelColor = (level: string) => {
    const colors = {
      bronze: "text-amber-600",
      silver: "text-gray-500",
      gold: "text-yellow-500",
      platinum: "text-purple-500",
    };
    return colors[level as keyof typeof colors] || colors.bronze;
  };

  const getPointsToNextLevel = (currentLevel: string, points: number) => {
    const thresholds = {
      bronze: 500,
      silver: 1000,
      gold: 2000,
      platinum: 5000,
    };

    const currentThreshold =
      thresholds[currentLevel as keyof typeof thresholds] || 0;
    const nextLevel = Object.entries(thresholds).find(
      ([_, threshold]) => threshold > currentThreshold
    );

    if (!nextLevel) return 0;

    return nextLevel[1] - points;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando programa de lealtad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Programa de Lealtad</h1>
          <p className="text-muted-foreground">
            Gestiona puntos y niveles de trabajadores
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Asignar Puntos
        </Button>
      </div>

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
            <CardTitle className="text-sm font-medium">
              Puntos Promedio
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.length > 0
                ? Math.round(
                    workers.reduce((sum, w) => sum + w.total_points, 0) /
                      workers.length
                  )
                : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos Completados
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.reduce((sum, w) => sum + w.events_completed, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Penalizaciones
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.reduce((sum, w) => sum + w.penalties_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["bronze", "silver", "gold", "platinum"].map((level) => {
          const count = workers.filter((w) => w.current_level === level).length;
          const percentage =
            workers.length > 0 ? (count / workers.length) * 100 : 0;

          return (
            <Card key={level}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize flex items-center space-x-2">
                  {getLevelBadge(level)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% del total
                </div>
              </CardContent>
            </Card>
          );
        })}
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
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="bronze">Bronce</SelectItem>
                <SelectItem value="silver">Plata</SelectItem>
                <SelectItem value="gold">Oro</SelectItem>
                <SelectItem value="platinum">Platino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Workers Loyalty Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trabajadores ({filteredWorkers.length})</CardTitle>
          <CardDescription>
            Lista de trabajadores y sus puntos de lealtad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabajador</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Penalizaciones</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{worker.worker_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {worker.worker_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getLevelBadge(worker.current_level)}</TableCell>
                  <TableCell>
                    <div className="font-bold text-lg">
                      {worker.total_points.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Trophy className="h-4 w-4 text-green-500" />
                      <span>{worker.events_completed}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4 text-red-500" />
                      <span>{worker.penalties_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {getPointsToNextLevel(
                          worker.current_level,
                          worker.total_points
                        )}{" "}
                        pts para siguiente nivel
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (worker.total_points / 2000) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
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

          {filteredWorkers.length === 0 && (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron trabajadores
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
