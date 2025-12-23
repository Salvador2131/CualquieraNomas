"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";

const PRICING = {
  worker: {
    monthly: 2000,
    label: "Trabajador",
    description: "Acceso completo a la plataforma",
  },
  company: {
    inicio: 29900,
    crecimiento: 0,
    label: "Empresa",
    description: "Plan Inicio: 5 eventos/mes",
  },
};

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as "worker" | "company" | null;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [months, setMonths] = useState(1);
  const [plan, setPlan] = useState("inicio");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const subscriptionType = type || "worker";

  const calculateTotal = () => {
    if (subscriptionType === "worker") {
      return PRICING.worker.monthly * months;
    } else {
      return PRICING.company.inicio * months;
    }
  };

  const handleCheckout = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription_type: subscriptionType,
          plan: subscriptionType === "company" ? plan : undefined,
          months,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al crear pago");
      }

      // En producción, redirigir a Flow/Webpay
      // Por ahora, simular confirmación inmediata
      if (data.payment_intent) {
        // Simular pago exitoso (solo para desarrollo)
        const confirmResponse = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription_id: data.payment_intent.subscription_id,
            payment_id: `test_${Date.now()}`,
          }),
        });

        const confirmData = await confirmResponse.json();

        if (confirmResponse.ok && confirmData.success) {
          setSuccess(true);
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          throw new Error("Error al confirmar pago");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  if (!type || (type !== "worker" && type !== "company")) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Tipo de suscripción inválido</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Checkout de Suscripción</h1>
        <p className="text-muted-foreground">
          Completa tu suscripción para acceder a todas las funcionalidades
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 mb-6">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ¡Pago confirmado! Tu suscripción ha sido activada. Redirigiendo...
          </AlertDescription>
        </Alert>
      )}

      {/* Subscription Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Suscripción {PRICING[subscriptionType].label}</CardTitle>
          <CardDescription>
            {PRICING[subscriptionType].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionType === "company" && (
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={plan}
                onValueChange={setPlan}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inicio">
                    Plan Inicio - $29.900 CLP/mes (5 eventos/mes)
                  </SelectItem>
                  <SelectItem value="crecimiento" disabled>
                    Plan Crecimiento - Próximamente
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Duración</Label>
            <Select
              value={months.toString()}
              onValueChange={(value) => setMonths(parseInt(value))}
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mes</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Precio por mes
              </span>
              <span className="font-medium">
                $
                {subscriptionType === "worker"
                  ? PRICING.worker.monthly.toLocaleString("es-CL")
                  : PRICING.company.inicio.toLocaleString("es-CL")}{" "}
                CLP
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Duración</span>
              <span className="font-medium">
                {months} {months === 1 ? "mes" : "meses"}
              </span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">
                ${calculateTotal().toLocaleString("es-CL")} CLP
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Método de Pago</CardTitle>
          <CardDescription>
            Selecciona tu método de pago preferido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Webpay / Flow</p>
                <p className="text-sm text-muted-foreground">
                  Tarjeta de crédito, débito o transferencia
                </p>
              </div>
              <Badge variant="outline">Recomendado</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Button */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleCheckout}
          disabled={submitting || success}
          className="flex-1"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Pagar ${calculateTotal().toLocaleString("es-CL")} CLP
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Al continuar, serás redirigido a la pasarela de pagos segura. Tu
        información está protegida.
      </p>
    </div>
  );
}
