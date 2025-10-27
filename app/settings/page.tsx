"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Bell,
  Lock,
  Globe,
  Mail,
  Shield,
  Database,
  Download,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
      events: true,
      payroll: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
    },
    general: {
      companyName: "",
      companyEmail: "",
      companyPhone: "",
      timezone: "America/Mexico_City",
      language: "es",
    },
    integrations: {
      supabaseConnected: true,
      googleCalendar: false,
      emailService: false,
    },
  });

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar en la base de datos
    alert("Configuración guardada exitosamente");
  };

  const handleExport = () => {
    alert("Exportando datos...");
  };

  const handleImport = () => {
    alert("Importando datos...");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Configuración del Sistema
        </h1>
        <p className="text-muted-foreground">
          Administra las configuraciones generales del sistema
        </p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              <CardTitle>Notificaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">
                  Notificaciones por Email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recibe notificaciones importantes por correo
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.notifications.email}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "email", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Notificaciones Push</Label>
                <p className="text-sm text-muted-foreground">
                  Notificaciones en tiempo real en el navegador
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.notifications.push}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "push", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="event-notifications">
                  Notificaciones de Eventos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alerta sobre eventos próximos
                </p>
              </div>
              <Switch
                id="event-notifications"
                checked={settings.notifications.events}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "events", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="payroll-notifications">
                  Notificaciones de Nómina
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recordatorios sobre fechas de pago
                </p>
              </div>
              <Switch
                id="payroll-notifications"
                checked={settings.notifications.payroll}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "payroll", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Lock className="mr-2 h-5 w-5" />
              <CardTitle>Seguridad</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor">
                  Autenticación de Dos Factores
                </Label>
                <p className="text-sm text-muted-foreground">
                  Agrega una capa extra de seguridad
                </p>
              </div>
              <Switch
                id="two-factor"
                checked={settings.security.twoFactor}
                onCheckedChange={(checked) =>
                  updateSetting("security", "twoFactor", checked)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-timeout">
                Tiempo de Sesión (minutos)
              </Label>
              <Input
                id="session-timeout"
                type="number"
                min="5"
                max="120"
                value={settings.security.sessionTimeout}
                onChange={(e) =>
                  updateSetting(
                    "security",
                    "sessionTimeout",
                    parseInt(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-expiry">
                Expiración de Contraseña (días)
              </Label>
              <Input
                id="password-expiry"
                type="number"
                min="30"
                value={settings.security.passwordExpiry}
                onChange={(e) =>
                  updateSetting(
                    "security",
                    "passwordExpiry",
                    parseInt(e.target.value)
                  )
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* General */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              <CardTitle>Configuración General</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nombre de la Empresa</Label>
              <Input
                id="company-name"
                value={settings.general.companyName}
                onChange={(e) =>
                  updateSetting("general", "companyName", e.target.value)
                }
                placeholder="Nombre de tu empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Email de la Empresa</Label>
              <Input
                id="company-email"
                type="email"
                value={settings.general.companyEmail}
                onChange={(e) =>
                  updateSetting("general", "companyEmail", e.target.value)
                }
                placeholder="contacto@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Teléfono de la Empresa</Label>
              <Input
                id="company-phone"
                value={settings.general.companyPhone}
                onChange={(e) =>
                  updateSetting("general", "companyPhone", e.target.value)
                }
                placeholder="+52 123 456 7890"
              />
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              <CardTitle>Integraciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="supabase">Supabase</Label>
                <p className="text-sm text-muted-foreground">
                  Base de datos principal
                </p>
              </div>
              <Badge
                variant={
                  settings.integrations.supabaseConnected
                    ? "default"
                    : "secondary"
                }
              >
                {settings.integrations.supabaseConnected
                  ? "Conectado"
                  : "Desconectado"}
              </Badge>
            </div>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Todas las conexiones están encriptadas y seguras
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Datos
              </Button>
              <Button
                onClick={handleImport}
                variant="outline"
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar Datos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

