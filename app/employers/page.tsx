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
import { Search, Plus, MoreHorizontal, Building2, Calendar, DollarSign, Phone, Mail, Globe } from "lucide-react"

const employers = [
  {
    id: 1,
    name: "Juan Empresario",
    email: "empresa1@email.com",
    phone: "+34 666 567 890",
    company: "Eventos Premium S.L.",
    website: "www.eventospremium.com",
    address: "Calle Mayor 123, Madrid",
    eventsCreated: 15,
    totalSpent: 45000,
    status: "activo",
    joinDate: "2023-01-15",
    rating: 4.7,
    lastEvent: "2024-01-15",
  },
  {
    id: 2,
    name: "Laura Eventos",
    email: "empresa2@email.com",
    phone: "+34 666 678 901",
    company: "Celebraciones Laura",
    website: "www.celebracioneslaura.com",
    address: "Avenida Principal 456, Barcelona",
    eventsCreated: 22,
    totalSpent: 67500,
    status: "activo",
    joinDate: "2022-11-10",
    rating: 4.9,
    lastEvent: "2024-01-18",
  },
  {
    id: 3,
    name: "Carlos Martínez",
    email: "carlos.martinez@corporativo.com",
    phone: "+34 666 789 012",
    company: "Eventos Corporativos CM",
    website: "www.eventoscm.com",
    address: "Plaza Central 789, Valencia",
    eventsCreated: 8,
    totalSpent: 28000,
    status: "activo",
    joinDate: "2023-06-20",
    rating: 4.5,
    lastEvent: "2024-01-10",
  },
  {
    id: 4,
    name: "Ana Rodríguez",
    email: "ana.rodriguez@bodas.com",
    phone: "+34 666 890 123",
    company: "Bodas de Ensueño",
    website: "www.bodasdeensueno.com",
    address: "Calle Romántica 321, Sevilla",
    eventsCreated: 35,
    totalSpent: 125000,
    status: "premium",
    joinDate: "2022-03-05",
    rating: 4.8,
    lastEvent: "2024-01-20",
  },
  {
    id: 5,
    name: "Miguel Torres",
    email: "miguel.torres@eventos.com",
    phone: "+34 666 901 234",
    company: "Torres Eventos",
    website: "www.torreseventos.com",
    address: "Avenida Libertad 654, Bilbao",
    eventsCreated: 3,
    totalSpent: 8500,
    status: "inactivo",
    joinDate: "2023-10-15",
    rating: 4.2,
    lastEvent: "2023-12-15",
  },
]

export default function EmployersPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEmployers = employers.filter(
    (employer) =>
      employer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "premium":
        return "bg-yellow-100 text-yellow-800"
      case "activo":
        return "bg-green-100 text-green-800"
      case "inactivo":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Empleadores</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Empleador
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleadores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employers.length}</div>
            <p className="text-xs text-muted-foreground">
              {employers.filter((e) => e.status === "activo" || e.status === "premium").length} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Totales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employers.reduce((acc, e) => acc + e.eventsCreated, 0)}</div>
            <p className="text-xs text-muted-foreground">Este año</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{employers.reduce((acc, e) => acc + e.totalSpent, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Facturación total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(employers.reduce((acc, e) => acc + e.rating, 0) / employers.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">De 5.0 estrellas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empleadores</CardTitle>
          <CardDescription>Gestiona tus clientes y empresas contratantes</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empleadores..."
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
                <TableHead>Empleador</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Gasto Total</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployers.map((employer) => (
                <TableRow key={employer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={`/placeholder-user.jpg`} />
                        <AvatarFallback>
                          {employer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{employer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Cliente desde {new Date(employer.joinDate).toLocaleDateString("es-ES")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{employer.company}</div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-1">
                        <Globe className="w-3 h-3" />
                        <span>{employer.website}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="w-3 h-3" />
                        <span>{employer.email}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Phone className="w-3 h-3" />
                        <span>{employer.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{employer.eventsCreated}</div>
                      <div className="text-sm text-muted-foreground">
                        Último: {new Date(employer.lastEvent).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">€{employer.totalSpent.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      Promedio: €{Math.round(employer.totalSpent / employer.eventsCreated).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(employer.rating) ? "text-yellow-400" : "text-gray-300"
                            }`}
                          >
                            ★
                          </div>
                        ))}
                      </div>
                      <span className="text-sm">{employer.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(employer.status)}>{employer.status}</Badge>
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
                        <DropdownMenuItem>Ver perfil completo</DropdownMenuItem>
                        <DropdownMenuItem>Editar información</DropdownMenuItem>
                        <DropdownMenuItem>Ver historial de eventos</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Generar reporte</DropdownMenuItem>
                        <DropdownMenuItem>Enviar mensaje</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Crear nueva cotización</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sección de estadísticas adicionales */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Empleadores por Eventos</CardTitle>
            <CardDescription>Los clientes más activos del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employers
                .sort((a, b) => b.eventsCreated - a.eventsCreated)
                .slice(0, 5)
                .map((employer, index) => (
                  <div key={employer.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>
                        {employer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{employer.name}</p>
                      <p className="text-xs text-muted-foreground">{employer.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{employer.eventsCreated} eventos</p>
                      <p className="text-xs text-muted-foreground">€{employer.totalSpent.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
            <CardDescription>Estado actual de los empleadores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  status: "premium",
                  count: employers.filter((e) => e.status === "premium").length,
                  color: "bg-yellow-500",
                },
                {
                  status: "activo",
                  count: employers.filter((e) => e.status === "activo").length,
                  color: "bg-green-500",
                },
                {
                  status: "inactivo",
                  count: employers.filter((e) => e.status === "inactivo").length,
                  color: "bg-gray-500",
                },
              ].map((item) => (
                <div key={item.status} className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${item.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{item.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.count}</p>
                    <p className="text-xs text-muted-foreground">
                      {((item.count / employers.length) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
