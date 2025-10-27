"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Package,
  Utensils,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Event {
  id: string;
  titulo: string;
  checklist: any;
}

interface EventChecklistModalProps {
  event: Event | null;
  open: boolean;
  onClose: () => void;
}

const checklistCategories = [
  {
    key: "recursos_humanos",
    title: "Recursos Humanos",
    icon: Users,
    color: "text-blue-600",
    fields: [
      {
        key: "garzones_requeridos",
        label: "Garzones Requeridos",
        type: "number",
      },
      {
        key: "garzones_asignados",
        label: "Garzones Asignados",
        type: "number",
      },
      {
        key: "bartenders_requeridos",
        label: "Bartenders Requeridos",
        type: "number",
      },
      {
        key: "bartenders_asignados",
        label: "Bartenders Asignados",
        type: "number",
      },
      {
        key: "personal_cocina_requerido",
        label: "Personal de Cocina Requerido",
        type: "number",
      },
      {
        key: "personal_cocina_asignado",
        label: "Personal de Cocina Asignado",
        type: "number",
      },
      {
        key: "supervisores_requeridos",
        label: "Supervisores Requeridos",
        type: "number",
      },
      {
        key: "supervisores_asignados",
        label: "Supervisores Asignados",
        type: "number",
      },
    ],
  },
  {
    key: "equipamiento_mobiliario",
    title: "Equipamiento y Mobiliario",
    icon: Package,
    color: "text-green-600",
    fields: [
      {
        key: "mesas_sillas_requeridas",
        label: "Mesas y Sillas Requeridas",
        type: "number",
      },
      {
        key: "mesas_sillas_asignadas",
        label: "Mesas y Sillas Asignadas",
        type: "number",
      },
      {
        key: "manteleria_vajilla_requerida",
        label: "Mantelería y Vajilla Requerida",
        type: "checkbox",
      },
      {
        key: "manteleria_vajilla_asignada",
        label: "Mantelería y Vajilla Asignada",
        type: "checkbox",
      },
    ],
  },
  {
    key: "alimentacion_bebidas",
    title: "Alimentación y Bebidas",
    icon: Utensils,
    color: "text-orange-600",
    fields: [
      { key: "menu_aprobado", label: "Menú Aprobado", type: "checkbox" },
      {
        key: "lista_bebidas_aprobada",
        label: "Lista de Bebidas Aprobada",
        type: "checkbox",
      },
    ],
  },
  {
    key: "aspectos_logisticos",
    title: "Aspectos Logísticos",
    icon: Truck,
    color: "text-purple-600",
    fields: [
      {
        key: "transporte_equipos",
        label: "Transporte de Equipos",
        type: "checkbox",
      },
      { key: "horarios_montaje", label: "Horarios de Montaje", type: "text" },
      {
        key: "horarios_desmontaje",
        label: "Horarios de Desmontaje",
        type: "text",
      },
    ],
  },
];

export default function EventChecklistModal({
  event,
  open,
  onClose,
}: EventChecklistModalProps) {
  const [checklist, setChecklist] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event && open) {
      setChecklist(event.checklist || {});
    }
  }, [event, open]);

  const handleFieldChange = async (
    categoria: string,
    campo: string,
    valor: any
  ) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/events/${event?.id}/checklist`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoria,
          campo,
          valor,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el checklist");
      }

      const data = await response.json();
      setChecklist(data.checklist);
    } catch (err) {
      console.error("Error updating checklist:", err);
      setError(
        err instanceof Error ? err.message : "Error al actualizar el checklist"
      );
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    const categories = Object.keys(checklist);
    if (categories.length === 0) return 0;

    const completedCategories = categories.filter(
      (cat) => checklist[cat]?.completado
    );
    return Math.round((completedCategories.length / categories.length) * 100);
  };

  const renderField = (categoria: string, field: any) => {
    const value =
      checklist[categoria]?.[field.key] ||
      (field.type === "checkbox" ? false : field.type === "number" ? 0 : "");

    switch (field.type) {
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${categoria}-${field.key}`}
              checked={value}
              onCheckedChange={(checked) =>
                handleFieldChange(categoria, field.key, checked)
              }
              disabled={loading}
            />
            <Label htmlFor={`${categoria}-${field.key}`} className="text-sm">
              {field.label}
            </Label>
          </div>
        );

      case "number":
        return (
          <div className="space-y-1">
            <Label htmlFor={`${categoria}-${field.key}`} className="text-sm">
              {field.label}
            </Label>
            <Input
              id={`${categoria}-${field.key}`}
              type="number"
              min="0"
              value={value}
              onChange={(e) =>
                handleFieldChange(
                  categoria,
                  field.key,
                  parseInt(e.target.value) || 0
                )
              }
              disabled={loading}
              className="w-24"
            />
          </div>
        );

      case "text":
        return (
          <div className="space-y-1">
            <Label htmlFor={`${categoria}-${field.key}`} className="text-sm">
              {field.label}
            </Label>
            <Input
              id={`${categoria}-${field.key}`}
              value={value}
              onChange={(e) =>
                handleFieldChange(categoria, field.key, e.target.value)
              }
              disabled={loading}
              placeholder="Ingresa la información"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Checklist de Evento: {event.titulo}</span>
          </DialogTitle>
          <DialogDescription>
            Gestiona todos los aspectos de preparación del evento
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Progreso General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Progreso General</span>
              <Badge variant="outline">
                {getCompletionPercentage()}% Completado
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Categorías del Checklist */}
        <div className="space-y-6">
          {checklistCategories.map((category) => {
            const Icon = category.icon;
            const categoryData = checklist[category.key] || {};
            const isCompleted = categoryData.completado || false;

            return (
              <Card key={category.key}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 ${category.color}`} />
                    <span>{category.title}</span>
                    <Badge variant={isCompleted ? "default" : "secondary"}>
                      {isCompleted ? "Completado" : "Pendiente"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {category.fields.length} elementos en esta categoría
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        {renderField(category.key, field)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onClose}>Guardar Cambios</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
