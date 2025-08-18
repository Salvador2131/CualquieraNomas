"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Users, MapPin } from "lucide-react"

const events = [
  {
    id: 1,
    title: "Boda García-López",
    date: new Date(2024, 0, 15),
    time: "18:00",
    duration: "6 horas",
    guests: 120,
    location: "Salón Primavera",
    status: "confirmado",
    workers: 8,
  },
  {
    id: 2,
    title: "Evento Corporativo TechCorp",
    date: new Date(2024, 0, 16),
    time: "12:00",
    duration: "4 horas",
    guests: 80,
    location: "Hotel Plaza",
    status: "pendiente",
    workers: 5,
  },
  {
    id: 3,
    title: "Quinceañera María",
    date: new Date(2024, 0, 18),
    time: "19:00",
    duration: "5 horas",
    guests: 150,
    location: "Jardín Las Flores",
    status: "confirmado",
    workers: 10,
  },
]

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const selectedEvents = events.filter(
    (event) => selectedDate && event.date.toDateString() === selectedDate.toDateString(),
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Calendario de Eventos</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
            <CardDescription>Selecciona una fecha para ver los eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasEvent: events.map((event) => event.date),
              }}
              modifiersStyles={{
                hasEvent: { backgroundColor: "hsl(var(--primary))", color: "white" },
              }}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              Eventos del{" "}
              {selectedDate?.toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
            <CardDescription>{selectedEvents.length} evento(s) programado(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay eventos programados para esta fecha</div>
            ) : (
              selectedEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <Badge variant={event.status === "confirmado" ? "default" : "secondary"}>{event.status}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {event.time} ({event.duration})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>{event.guests} invitados</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>{event.workers} trabajadores</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      Asignar Personal
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
