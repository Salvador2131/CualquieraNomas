"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users, Clock, MapPin, Calculator } from "lucide-react"

const serviceTypes = [
  { id: "wedding", name: "Boda", basePrice: 50 },
  { id: "corporate", name: "Evento Corporativo", basePrice: 35 },
  { id: "birthday", name: "Cumpleaños", basePrice: 30 },
  { id: "quinceañera", name: "Quinceañera", basePrice: 45 },
  { id: "other", name: "Otro", basePrice: 40 },
]

const additionalServices = [
  { id: "decoration", name: "Decoración Premium", price: 500 },
  { id: "music", name: "Música y DJ", price: 300 },
  { id: "photography", name: "Fotografía", price: 400 },
  { id: "flowers", name: "Arreglos Florales", price: 200 },
  { id: "transport", name: "Transporte", price: 150 },
  { id: "security", name: "Seguridad", price: 250 },
]

export default function QuotePage() {
  const [formData, setFormData] = useState({
    eventType: "",
    guests: "",
    date: "",
    duration: "",
    location: "",
    description: "",
    selectedServices: [] as string[],
  })

  const [quote, setQuote] = useState<number | null>(null)

  const calculateQuote = () => {
    const eventType = serviceTypes.find((s) => s.id === formData.eventType)
    if (!eventType || !formData.guests) return

    const basePrice = eventType.basePrice * Number.parseInt(formData.guests)
    const servicesPrice = additionalServices
      .filter((service) => formData.selectedServices.includes(service.id))
      .reduce((total, service) => total + service.price, 0)

    const duration = Number.parseInt(formData.duration) || 4
    const durationMultiplier = duration > 4 ? 1 + (duration - 4) * 0.1 : 1

    const total = (basePrice + servicesPrice) * durationMultiplier
    setQuote(total)
  }

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: checked
        ? [...prev.selectedServices, serviceId]
        : prev.selectedServices.filter((id) => id !== serviceId),
    }))
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cotizador de Eventos</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 h-5" />
              <span>Información del Evento</span>
            </CardTitle>
            <CardDescription>Completa los detalles para generar una cotización personalizada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, eventType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} (€{type.basePrice}/persona)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guests">Número de Invitados</Label>
                <Input
                  id="guests"
                  type="number"
                  placeholder="150"
                  value={formData.guests}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guests: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (horas)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="4"
                  value={formData.duration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha del Evento</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Dirección del evento"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción Adicional</Label>
              <Textarea
                id="description"
                placeholder="Detalles especiales, requerimientos, etc."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Servicios Adicionales</Label>
              {additionalServices.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.id}
                    checked={formData.selectedServices.includes(service.id)}
                    onCheckedChange={(checked) => handleServiceChange(service.id, checked as boolean)}
                  />
                  <Label htmlFor={service.id} className="flex-1">
                    {service.name}
                  </Label>
                  <span className="text-sm font-medium">€{service.price}</span>
                </div>
              ))}
            </div>

            <Button onClick={calculateQuote} className="w-full">
              Generar Cotización
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Cotización</CardTitle>
            <CardDescription>Detalles y precio estimado de tu evento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quote ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Fecha: {formData.date || "No especificada"}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Invitados: {formData.guests || "No especificado"}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Duración: {formData.duration || "4"} horas</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>Ubicación: {formData.location || "No especificada"}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Desglose de Precios:</h4>
                  <div className="space-y-1 text-sm">
                    {formData.eventType && formData.guests && (
                      <div className="flex justify-between">
                        <span>Servicio base ({formData.guests} personas)</span>
                        <span>
                          €
                          {(serviceTypes.find((s) => s.id === formData.eventType)?.basePrice || 0) *
                            Number.parseInt(formData.guests)}
                        </span>
                      </div>
                    )}
                    {formData.selectedServices.map((serviceId) => {
                      const service = additionalServices.find((s) => s.id === serviceId)
                      return service ? (
                        <div key={serviceId} className="flex justify-between">
                          <span>{service.name}</span>
                          <span>€{service.price}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Estimado:</span>
                  <span className="text-2xl text-primary">€{quote.toLocaleString()}</span>
                </div>

                <div className="space-y-2">
                  <Button className="w-full">Solicitar Cotización Oficial</Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    Guardar Cotización
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  * Los precios son estimados y pueden variar según los requerimientos específicos del evento.
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Completa la información del evento para ver la cotización</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
