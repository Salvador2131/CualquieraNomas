"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Calendar,
  Users,
  DollarSign,
  Save,
  Send,
  Plus,
  Trash2,
} from "lucide-react";

interface Service {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function QuotePage() {
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    event_type: "",
    event_date: "",
    guest_count: 1,
    base_price: 0,
    taxes_percentage: 16,
    expiration_days: 30,
    notes: "",
  });

  const [services, setServices] = useState<Service[]>([]);
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    taxes: 0,
    total: 0,
  });

  const [showPreview, setShowPreview] = useState(false);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    calculateTotals();
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { name: "", description: "", quantity: 1, unit_price: 0, total: 0 },
    ]);
  };

  const updateService = (index: number, field: keyof Service, value: any) => {
    setServices((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Recalcular total del servicio
      if (field === "quantity" || field === "unit_price") {
        updated[index].total =
          updated[index].quantity * updated[index].unit_price;
      }

      return updated;
    });
    calculateTotals();
  };

  const removeService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
    calculateTotals();
  };

  const calculateTotals = () => {
    const subtotal =
      services.reduce((sum, s) => sum + s.total, 0) + formData.base_price;
    const taxes = subtotal * (formData.taxes_percentage / 100);
    const total = subtotal + taxes;

    setCalculations({ subtotal, taxes, total });
  };

  const handleSubmit = async (status: string = "draft") => {
    try {
      const quoteData = {
        ...formData,
        services,
        subtotal: calculations.subtotal,
        taxes: calculations.taxes,
        total: calculations.total,
        expiration_date: new Date(
          Date.now() + formData.expiration_days * 24 * 60 * 60 * 1000
        ).toISOString(),
        status,
      };

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          "Cotización " +
            (status === "sent" ? "enviada" : "guardada") +
            " exitosamente"
        );
        // Reset form
        setFormData({
          client_name: "",
          client_email: "",
          client_phone: "",
          event_type: "",
          event_date: "",
          guest_count: 1,
          base_price: 0,
          taxes_percentage: 16,
          expiration_days: 30,
          notes: "",
        });
        setServices([]);
        setCalculations({ subtotal: 0, taxes: 0, total: 0 });
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error submitting quote:", error);
      alert("Error al guardar la cotización");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Nueva Cotización
        </h1>
        <p className="text-muted-foreground">
          Genera cotizaciones para tus clientes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form Section */}
        <div className="md:col-span-2 space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nombre del Cliente *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) =>
                      updateFormData("client_name", e.target.value)
                    }
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) =>
                      updateFormData("client_email", e.target.value)
                    }
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Teléfono</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) =>
                    updateFormData("client_phone", e.target.value)
                  }
                  placeholder="+52 123 456 7890"
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event_type">Tipo de Evento *</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) =>
                      updateFormData("event_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Boda</SelectItem>
                      <SelectItem value="corporate">Corporativo</SelectItem>
                      <SelectItem value="party">Fiesta</SelectItem>
                      <SelectItem value="conference">Conferencia</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_date">Fecha del Evento *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) =>
                      updateFormData("event_date", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guest_count">Número de Invitados *</Label>
                  <Input
                    id="guest_count"
                    type="number"
                    min="1"
                    value={formData.guest_count}
                    onChange={(e) =>
                      updateFormData(
                        "guest_count",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_price">Precio Base *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) =>
                      updateFormData(
                        "base_price",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Servicios</CardTitle>
                <Button onClick={addService} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Servicio
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay servicios agregados. Haz clic en "Agregar Servicio"
                </p>
              ) : (
                services.map((service, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Servicio {index + 1}</h4>
                      <Button
                        onClick={() => removeService(index)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Nombre del Servicio *</Label>
                        <Input
                          value={service.name}
                          onChange={(e) =>
                            updateService(index, "name", e.target.value)
                          }
                          placeholder="Ej: Catering"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Input
                          value={service.description}
                          onChange={(e) =>
                            updateService(index, "description", e.target.value)
                          }
                          placeholder="Detalles adicionales"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={service.quantity}
                            onChange={(e) =>
                              updateService(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio Unitario *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={service.unit_price}
                            onChange={(e) =>
                              updateService(
                                index,
                                "unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Total</Label>
                          <Input
                            value={`$${service.total.toFixed(2)}`}
                            disabled
                            className="font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxes_percentage">IVA (%)</Label>
                  <Input
                    id="taxes_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.taxes_percentage}
                    onChange={(e) =>
                      updateFormData(
                        "taxes_percentage",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiration_days">Vigencia (días)</Label>
                  <Input
                    id="expiration_days"
                    type="number"
                    min="1"
                    value={formData.expiration_days}
                    onChange={(e) =>
                      updateFormData(
                        "expiration_days",
                        parseInt(e.target.value) || 30
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                  value={formData.notes}
                  onChange={(e) => updateFormData("notes", e.target.value)}
                  placeholder="Notas adicionales..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Section */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium">
                  ${calculations.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>IVA ({formData.taxes_percentage}%)</span>
                <span>${calculations.taxes.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${calculations.total.toFixed(2)}</span>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleSubmit("draft")}
                  variant="outline"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Borrador
                </Button>
                <Button className="w-full" onClick={() => handleSubmit("sent")}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Cotización
                </Button>
              </div>

              {/* Event Info */}
              <div className="pt-4 border-t space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {formData.event_date
                    ? new Date(formData.event_date).toLocaleDateString("es-MX")
                    : "Sin fecha"}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  {formData.guest_count} invitados
                </div>
                <div className="flex items-center text-muted-foreground">
                  <DollarSign className="mr-2 h-4 w-4" />
                  {services.length} servicios
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

