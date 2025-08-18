"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Star, TrendingUp, Users, Calendar } from "lucide-react"

const ratings = [
  {
    id: 1,
    eventName: "Boda García-López",
    eventDate: "2024-01-15",
    workerName: "Ana García",
    workerPosition: "Mesero",
    employerName: "Juan Empresario",
    rating: 5,
    review: "Excelente servicio, muy profesional y atento durante todo el evento",
    ratingType: "employer_to_worker",
    createdAt: "2024-01-16",
  },
  {
    id: 2,
    eventName: "Boda García-López",
    eventDate: "2024-01-15",
    workerName: "Carlos López",
    workerPosition: "Chef",
    employerName: "Juan Empresario",
    rating: 5,
    review: "La comida estuvo espectacular, superó todas las expectativas",
    ratingType: "employer_to_worker",
    createdAt: "2024-01-16",
  },
  {
    id: 3,
    eventName: "Evento Corporativo TechCorp",
    eventDate: "2024-01-16",
    workerName: "José Martín",
    workerPosition: "Bartender",
    employerName: "Juan Empresario",
    rating: 5,
    review: "Cócteles increíbles y muy creativo con las presentaciones",
    ratingType: "employer_to_worker",
    createdAt: "2024-01-17",
  },
  {
    id: 4,
    eventName: "Quinceañera María",
    eventDate: "2024-01-18",
    workerName: "María Rodríguez",
    workerPosition: "Coordinador",
    employerName: "Laura Eventos",
    rating: 4,
    review: "Buena coordinación, aunque hubo algunos retrasos menores",
    ratingType: "employer_to_worker",
    createdAt: "2024-01-19",
  },
  {
    id: 5,
    eventName: "Boda García-López",
    eventDate: "2024-01-15",
    workerName: "Ana García",
    workerPosition: "Mesero",
    employerName: "Juan Empresario",
    rating: 4,
    review: "Cliente muy organizado, instrucciones claras",
    ratingType: "worker_to_employer",
    createdAt: "2024-01-16",
  },
]

export default function RatingsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  const filteredRatings = ratings.filter((rating) => {
    const matchesSearch =
      rating.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.eventName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === "all" || rating.ratingType === filterType

    return matchesSearch && matchesFilter
  })

  const averageRating = ratings.reduce((acc, rating) => acc + rating.rating, 0) / ratings.length

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sistema de Calificaciones</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calificaciones</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratings.length}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">De 5.0 estrellas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificaciones 5★</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratings.filter((r) => r.rating === 5).length}</div>
            <p className="text-xs text-muted-foreground">
              {((ratings.filter((r) => r.rating === 5).length / ratings.length) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Calificados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(ratings.map((r) => r.eventName)).size}</div>
            <p className="text-xs text-muted-foreground">Eventos únicos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Calificaciones</CardTitle>
          <CardDescription>Todas las calificaciones y reseñas del sistema</CardDescription>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar calificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                Todas
              </Button>
              <Button
                variant={filterType === "employer_to_worker" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("employer_to_worker")}
              >
                A Trabajadores
              </Button>
              <Button
                variant={filterType === "worker_to_employer" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("worker_to_employer")}
              >
                A Empleadores
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Evaluador</TableHead>
                <TableHead>Evaluado</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Reseña</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRatings.map((rating) => (
                <TableRow key={rating.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rating.eventName}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(rating.eventDate).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>
                          {rating.ratingType === "employer_to_worker"
                            ? rating.employerName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : rating.workerName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {rating.ratingType === "employer_to_worker" ? rating.employerName : rating.workerName}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {rating.ratingType === "employer_to_worker" ? "Empleador" : "Trabajador"}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>
                          {rating.ratingType === "employer_to_worker"
                            ? rating.workerName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : rating.employerName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {rating.ratingType === "employer_to_worker" ? rating.workerName : rating.employerName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {rating.ratingType === "employer_to_worker" ? rating.workerPosition : "Empleador"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(rating.rating)}</div>
                      <span className="font-medium">{rating.rating}.0</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm truncate" title={rating.review}>
                      {rating.review}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{new Date(rating.createdAt).toLocaleDateString("es-ES")}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
