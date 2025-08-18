"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, Star, Phone, Mail } from "lucide-react"

const workers = [
  {
    id: 1,
    name: "Ana García",
    email: "ana.garcia@email.com",
    phone: "+34 666 123 456",
    position: "Mesero",
    rating: 4.8,
    eventsCompleted: 45,
    status: "activo",
    joinDate: "2023-01-15",
    hourlyRate: 15,
  },
  {
    id: 2,
    name: "Carlos López",
    email: "carlos.lopez@email.com",
    phone: "+34 666 234 567",
    position: "Chef",
    rating: 4.9,
    eventsCompleted: 38,
    status: "activo",
    joinDate: "2023-03-20",
    hourlyRate: 25,
  },
  {
    id: 3,
    name: "María Rodríguez",
    email: "maria.rodriguez@email.com",
    phone: "+34 666 345 678",
    position: "Coordinador",
    rating: 4.7,
    eventsCompleted: 52,
    status: "activo",
    joinDate: "2022-11-10",
    hourlyRate: 20,
  },
  {
    id: 4,
    name: "José Martín",
    email: "jose.martin@email.com",
    phone: "+34 666 456 789",
    position: "Bartender",
    rating: 4.6,
    eventsCompleted: 29,
    status: "inactivo",
    joinDate: "2023-06-05",
    hourlyRate: 18,
  },
]

export default function WorkersPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.position.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Trabajadores</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Trabajador
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trabajadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers.length}</div>
            <p className="text-xs text-muted-foreground">
              {workers.filter((w) => w.status === "activo").length} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(workers.reduce((acc, w) => acc + w.rating, 0) / workers.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">De 5.0 estrellas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers.reduce((acc, w) => acc + w.eventsCompleted, 0)}</div>
            <p className="text-xs text-muted-foreground">Este año</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarifa Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{(workers.reduce((acc, w) => acc + w.hourlyRate, 0) / workers.length).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Por hora</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Trabajadores</CardTitle>
          <CardDescription>Gestiona tu equipo de trabajo y sus perfiles</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar trabajadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabajador</TableHead>
                <TableHead>Posición</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Tarifa/Hora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={`/placeholder-user.jpg`} />
                        <AvatarFallback>
                          {worker.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{worker.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Desde {new Date(worker.joinDate).toLocaleDateString("es-ES")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{worker.position}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="w-3 h-3" />
                        <span>{worker.email}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Phone className="w-3 h-3" />
                        <span>{worker.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{worker.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>{worker.eventsCompleted}</TableCell>
                  <TableCell>€{worker.hourlyRate}</TableCell>
                  <TableCell>
                    <Badge variant={worker.status === "activo" ? "default" : "secondary"}>{worker.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem>Editar información</DropdownMenuItem>
                        <DropdownMenuItem>Ver historial</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Calcular salario</DropdownMenuItem>
                        <DropdownMenuItem>Enviar mensaje</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
