import { Calendar, Users, DollarSign, Star, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/events/new">Nuevo Evento</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trabajadores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+8 nuevos esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">+0.2 puntos este mes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>Eventos programados para los próximos 7 días</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Boda García-López", date: "2024-01-15", time: "18:00", guests: 120, status: "Confirmado" },
              {
                name: "Evento Corporativo TechCorp",
                date: "2024-01-16",
                time: "12:00",
                guests: 80,
                status: "Pendiente",
              },
              { name: "Quinceañera María", date: "2024-01-18", time: "19:00", guests: 150, status: "Confirmado" },
              { name: "Cena de Gala Fundación", date: "2024-01-20", time: "20:00", guests: 200, status: "Confirmado" },
            ].map((event, index) => (
              <div key={index} className="flex items-center space-x-4 rounded-md border p-4">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{event.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date} a las {event.time} • {event.guests} invitados
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs ${
                    event.status === "Confirmado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {event.status}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Estadísticas Rápidas</CardTitle>
            <CardDescription>Resumen de actividad reciente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium">Crecimiento de Ventas</p>
                <p className="text-2xl font-bold text-green-600">+15%</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Tiempo Promedio de Servicio</p>
                <p className="text-2xl font-bold text-blue-600">4.2h</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Trabajadores del Mes</p>
                <p className="text-2xl font-bold text-purple-600">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
