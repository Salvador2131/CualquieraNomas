"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  CheckCircle,
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Users,
  DollarSign,
  MessageSquare,
} from "lucide-react";

const eventTypes = [
  { value: "Boda", label: "Boda" },
  { value: "Corporativo", label: "Evento Corporativo" },
  { value: "Fiesta", label: "Fiesta Privada" },
  { value: "Quinceañera", label: "Quinceañera" },
  { value: "Otro", label: "Otro" },
];

const services = [
  { id: "catering", label: "Catering y Alimentación" },
  { id: "decoracion", label: "Decoración" },
  { id: "musica", label: "Música y Sonido" },
  { id: "fotografia", label: "Fotografía y Video" },
  { id: "audiovisual", label: "Audiovisual" },
  { id: "entretenimiento", label: "Entretenimiento" },
  { id: "transporte", label: "Transporte" },
  { id: "coordinacion", label: "Coordinación Completa" },
];

export default function PreregisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Información de contacto
  const [contactInfo, setContactInfo] = useState({
    nombre_completo: "",
    email: "",
    telefono: "",
    empresa: "",
  });

  // Detalles del evento
  const [eventDetails, setEventDetails] = useState({
    tipo_evento: "",
    fecha_estimada: "",
    numero_invitados: "",
    ubicacion: "",
    servicios_requeridos: [] as string[],
    presupuesto_estimado: "",
    comentarios_adicionales: "",
  });

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    if (checked) {
      setEventDetails(prev => ({
        ...prev,
        servicios_requeridos: [...prev.servicios_requeridos, serviceId]
      }));
    } else {
      setEventDetails(prev => ({
        ...prev,
        servicios_requeridos: prev.servicios_requeridos.filter(id => id !== serviceId)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/preregister", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...contactInfo,
          ...eventDetails,
          numero_invitados: parseInt(eventDetails.numero_invitados),
          presupuesto_estimado: parseFloat(eventDetails.presupuesto_estimado) || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al enviar la solicitud");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">ERP Banquetes</span>
            </Link>
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-green-600">¡Solicitud Enviada!</h1>
            <p className="text-muted-foreground mt-2">
              Hemos recibido tu solicitud de evento. Te contactaremos en las próximas 24 horas.
            </p>
          </div>

          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Mientras tanto, puedes explorar nuestra galería de eventos anteriores.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/gallery">Ver Galería</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">Volver al Inicio</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">ERP Banquetes</span>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Solicitar Evento</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cuéntanos sobre tu evento y te ayudaremos a hacerlo realidad
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Información de Contacto</span>
              </CardTitle>
              <CardDescription>
                Datos para contactarte sobre tu evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                  <Input
                    id="nombre_completo"
                    value={contactInfo.nombre_completo}
                    onChange={(e) =>
                      setContactInfo(prev => ({
                        ...prev,
                        nombre_completo: e.target.value
                      }))
                    }
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) =>
                      setContactInfo(prev => ({
                        ...prev,
                        email: e.target.value
                      }))
                    }
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={contactInfo.telefono}
                    onChange={(e) =>
                      setContactInfo(prev => ({
                        ...prev,
                        telefono: e.target.value
                      }))
                    }
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa (Opcional)</Label>
                  <Input
                    id="empresa"
                    value={contactInfo.empresa}
                    onChange={(e) =>
                      setContactInfo(prev => ({
                        ...prev,
                        empresa: e.target.value
                      }))
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Evento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Detalles del Evento</span>
              </CardTitle>
              <CardDescription>
                Información específica sobre tu evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_evento">Tipo de Evento *</Label>
                  <Select
                    value={eventDetails.tipo_evento}
                    onValueChange={(value) =>
                      setEventDetails(prev => ({
                        ...prev,
                        tipo_evento: value
                      }))
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_estimada">Fecha Estimada *</Label>
                  <Input
                    id="fecha_estimada"
                    type="date"
                    value={eventDetails.fecha_estimada}
                    onChange={(e) =>
                      setEventDetails(prev => ({
                        ...prev,
                        fecha_estimada: e.target.value
                      }))
                    }
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_invitados">Número de Invitados *</Label>
                  <Input
                    id="numero_invitados"
                    type="number"
                    min="1"
                    value={eventDetails.numero_invitados}
                    onChange={(e) =>
                      setEventDetails(prev => ({
                        ...prev,
                        numero_invitados: e.target.value
                      }))
                    }
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="presupuesto_estimado">Presupuesto Estimado</Label>
                  <Input
                    id="presupuesto_estimado"
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventDetails.presupuesto_estimado}
                    onChange={(e) =>
                      setEventDetails(prev => ({
                        ...prev,
                        presupuesto_estimado: e.target.value
                      }))
                    }
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación *</Label>
                <Input
                  id="ubicacion"
                  value={eventDetails.ubicacion}
                  onChange={(e) =>
                    setEventDetails(prev => ({
                      ...prev,
                      ubicacion: e.target.value
                    }))
                  }
                  placeholder="Dirección o lugar del evento"
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Servicios Requeridos */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios Requeridos</CardTitle>
              <CardDescription>
                Selecciona los servicios que necesitas para tu evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.id}
                      checked={eventDetails.servicios_requeridos.includes(service.id)}
                      onCheckedChange={(checked) =>
                        handleServiceChange(service.id, checked as boolean)
                      }
                      disabled={loading}
                    />
                    <Label htmlFor={service.id} className="text-sm">
                      {service.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comentarios Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Comentarios Adicionales</span>
              </CardTitle>
              <CardDescription>
                Cuéntanos más detalles sobre tu evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={eventDetails.comentarios_adicionales}
                onChange={(e) =>
                  setEventDetails(prev => ({
                    ...prev,
                    comentarios_adicionales: e.target.value
                  }))
                }
                placeholder="Describe cualquier detalle especial, preferencias, o información adicional que consideres importante..."
                rows={4}
                disabled={loading}
              />
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-center space-x-4">
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={loading}
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Inicio
              </Link>
            </Button>
            <Button type="submit" disabled={loading} size="lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Solicitud
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
