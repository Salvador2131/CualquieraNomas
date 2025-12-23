"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface CurrentSubscription {
  type: "worker" | "company";
  subscription_type?: string;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_end_date?: string;
  approved?: boolean;
}

interface Subscription {
  id: string;
  subscription_type: string;
  plan: string;
  amount: number;
  status: string;
  payment_method?: string;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<CurrentSubscription | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscriptions");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar suscripciones");
      }

      setCurrent(data.current);
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      active: { label: "Activa", variant: "default" },
      pending: { label: "Pendiente", variant: "secondary" },
      cancelled: { label: "Cancelada", variant: "destructive" },
      expired: { label: "Expirada", variant: "outline" },
    };

    const config = configs[status] || configs.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando suscripciones...</p>
        </div>
      </div>
    );
  }

  const isExpired =
    current?.subscription_end_date &&
    new Date(current.subscription_end_date) < new Date();

  const needsSubscription =
    !current ||
    (current.type === "worker" &&
      current.subscription_type !== "paid" &&
      !current.approved) ||
    (current.type === "company" && current.subscription_status !== "active") ||
    isExpired;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mi Suscripción</h1>
        <p className="text-muted-foreground">
          Gestiona tu suscripción y métodos de pago
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Actual</CardTitle>
          <CardDescription>
            Información sobre tu suscripción actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!current ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No tienes una suscripción activa
              </p>
              <Button asChild>
                <Link
                  href={`/subscription/checkout?type=${
                    current?.type || "worker"
                  }`}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Suscribirse Ahora
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {current.type === "worker"
                      ? "Suscripción Trabajador"
                      : "Suscripción Empresa"}
                  </p>
                  {current.type === "worker" && (
                    <p className="text-sm text-muted-foreground">
                      Tipo:{" "}
                      {current.subscription_type === "free"
                        ? "Gratuita"
                        : current.subscription_type === "paid"
                        ? "Pagada"
                        : "Trial"}
                      {current.approved && " • Aprobada"}
                    </p>
                  )}
                  {current.type === "company" && (
                    <p className="text-sm text-muted-foreground">
                      Plan: {current.subscription_plan || "N/A"}
                      {current.subscription_status &&
                        ` • ${current.subscription_status}`}
                    </p>
                  )}
                </div>
                {current.subscription_end_date && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Válida hasta
                    </p>
                    <p className="font-medium">
                      {new Date(
                        current.subscription_end_date
                      ).toLocaleDateString()}
                    </p>
                    {isExpired && (
                      <Badge variant="destructive" className="mt-2">
                        Expirada
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {needsSubscription && (
                <div className="border-t pt-4">
                  <Button asChild className="w-full">
                    <Link href={`/subscription/checkout?type=${current.type}`}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Renovar Suscripción
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Suscripciones</CardTitle>
          <CardDescription>Todas tus suscripciones y pagos</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay historial de suscripciones
            </p>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold">
                        {sub.subscription_type === "worker"
                          ? "Trabajador"
                          : "Empresa"}{" "}
                        - {sub.plan}
                      </p>
                      {getStatusBadge(sub.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p>Monto: ${sub.amount.toLocaleString("es-CL")} CLP</p>
                        <p>Método: {sub.payment_method || "N/A"}</p>
                      </div>
                      <div>
                        <p>
                          Inicio:{" "}
                          {new Date(sub.start_date).toLocaleDateString()}
                        </p>
                        {sub.end_date && (
                          <p>
                            Fin: {new Date(sub.end_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
