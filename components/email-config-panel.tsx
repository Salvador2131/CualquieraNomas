"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Send,
} from "lucide-react";

interface EmailConfigPanelProps {
  onClose?: () => void;
}

export default function EmailConfigPanel({ onClose }: EmailConfigPanelProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    configured: boolean;
  } | null>(null);

  const sendTestEmail = async () => {
    if (!email) {
      setResult({
        success: false,
        message: "Por favor ingresa un email",
        configured: false,
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/email/send?to=${encodeURIComponent(email)}`
      );
      const data = await response.json();

      setResult({
        success: response.ok,
        message: data.message,
        configured: data.configured,
      });
    } catch (error) {
      setResult({
        success: false,
        message: "Error al enviar el email de prueba",
        configured: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Configuración de Email</span>
        </CardTitle>
        <CardDescription>
          Configura y prueba el sistema de notificaciones por email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado de Configuración */}
        <div className="space-y-2">
          <Label>Estado del Servicio de Email</Label>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span>Gmail SMTP</span>
            </Badge>
            <Badge variant="secondary">
              {result?.configured ? "Configurado" : "No configurado"}
            </Badge>
          </div>
        </div>

        {/* Instrucciones */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>Para configurar el email:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  Crea un archivo <code>.env.local</code> en la raíz del
                  proyecto
                </li>
                <li>
                  Agrega las variables de email del archivo{" "}
                  <code>env.example</code>
                </li>
                <li>
                  Para Gmail, usa una "App Password" en lugar de tu contraseña
                  normal
                </li>
                <li>
                  Reinicia el servidor después de configurar las variables
                </li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        {/* Prueba de Email */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-email">Email de Prueba</Label>
            <div className="flex space-x-2">
              <Input
                id="test-email"
                type="email"
                placeholder="tu-email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={sendTestEmail}
                disabled={loading || !email}
                variant="outline"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar Prueba
              </Button>
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="space-y-1">
                    <p>{result.message}</p>
                    {!result.configured && (
                      <p className="text-sm text-muted-foreground">
                        Verifica que las variables de entorno estén configuradas
                        correctamente.
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        {/* Variables de Entorno Necesarias */}
        <div className="space-y-2">
          <Label>Variables de Entorno Requeridas</Label>
          <div className="bg-gray-50 p-3 rounded-lg">
            <pre className="text-xs text-gray-700">
              {`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
            </pre>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          )}
          <Button
            onClick={sendTestEmail}
            disabled={loading || !email}
            className="flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Probar Email</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
