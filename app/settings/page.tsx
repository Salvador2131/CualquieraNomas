"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Settings, Bell, Shield, Database, Globe } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "ERP Banquetes",
    companyEmail: "info@erpbanquetes.com",
    companyPhone: "+34 900 123 456",
    companyAddress: "Calle Principal 123, Madrid",
    defaultHourlyRate: "15.00",
    loyaltyPointsPerEvent: "10",
    quoteValidityDays: "30",
    maxWorkersPerEvent: "20",
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    autoBackup: true,
    twoFactorAuth: false,
    sessionTimeout: "24",
    language: "es",
    timezone: "Europe/Madrid",
    currency: "EUR",
  })

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveSettings = () => {
    // Aquí se guardarían las configuraciones
    console.log("Guardando configuraciones:", settings)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h2>
        <Button onClick={saveSettings}>
          <Settings className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Información de la Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Información de la Empresa</span>
            </CardTitle>
            <CardDescription>Configuración básica de tu empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => handleSettingChange("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email de Contacto</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => handleSettingChange("companyEmail", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Teléfono</Label>
                <Input
                  id="companyPhone"
                  value={settings.companyPhone}
                  onChange={(e) => handleSettingChange("companyPhone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Dirección</Label>
                <Input
                  id="companyAddress"
                  value={settings.companyAddress}
                  onChange={(e) => handleSettingChange("companyAddress", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Negocio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Configuración de Negocio</span>
            </CardTitle>
            <CardDescription>Parámetros operativos del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultHourlyRate">Tarifa por Hora por Defecto (€)</Label>
                <Input
                  id="defaultHourlyRate"
                  type="number"
                  step="0.01"
                  value={settings.defaultHourlyRate}
                  onChange={(e) => handleSettingChange("defaultHourlyRate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loyaltyPointsPerEvent">Puntos de Lealtad por Evento</Label>
                <Input
                  id="loyaltyPointsPerEvent"
                  type="number"
                  value={settings.loyaltyPointsPerEvent}
                  onChange={(e) => handleSettingChange("loyaltyPointsPerEvent", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quoteValidityDays">Validez de Cotizaciones (días)</Label>
                <Input
                  id="quoteValidityDays"
                  type="number"
                  value={settings.quoteValidityDays}
                  onChange={(e) => handleSettingChange("quoteValidityDays", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxWorkersPerEvent">Máximo Trabajadores por Evento</Label>
                <Input
                  id="maxWorkersPerEvent"
                  type="number"
                  value={settings.maxWorkersPerEvent}
                  onChange={(e) => handleSettingChange("maxWorkersPerEvent", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notificaciones</span>
            </CardTitle>
            <CardDescription>Configurar cómo y cuándo recibir notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones por Email</Label>
                <p className="text-sm text-muted-foreground">Recibir notificaciones importantes por correo</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones SMS</Label>
                <p className="text-sm text-muted-foreground">Recibir alertas urgentes por mensaje de texto</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones Push</Label>
                <p className="text-sm text-muted-foreground">Notificaciones en tiempo real en el navegador</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Seguridad</span>
            </CardTitle>
            <CardDescription>Configuración de seguridad y privacidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autenticación de Dos Factores</Label>
                <p className="text-sm text-muted-foreground">Añadir una capa extra de seguridad</p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Respaldo Automático</Label>
                <p className="text-sm text-muted-foreground">Crear copias de seguridad automáticas</p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => handleSettingChange("autoBackup", checked)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Tiempo de Sesión (horas)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange("sessionTimeout", e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Localización */}
        <Card>
          <CardHeader>
            <CardTitle>Localización</CardTitle>
            <CardDescription>Configuración regional y de idioma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Select value={settings.timezone} onValueChange={(value) => handleSettingChange("timezone", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                    <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select value={settings.currency} onValueChange={(value) => handleSettingChange("currency", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">Dólar ($)</SelectItem>
                    <SelectItem value="GBP">Libra (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
