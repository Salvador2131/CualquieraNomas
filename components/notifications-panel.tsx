"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  CheckCircle,
  Calendar,
  User,
  Mail,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Package,
  Utensils,
  Truck,
} from "lucide-react";

interface Notification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  created_at: string;
  evento?: {
    id: string;
    titulo: string;
    fecha_evento: string;
  };
  preregistro?: {
    id: string;
    nombre_completo: string;
    tipo_evento: string;
  };
  datos_adicionales?: any;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

interface NotificationsPanelProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notificationIcons: Record<string, any> = {
  nuevo_evento: Calendar,
  evento_aprobado: CheckCircle,
  evento_rechazado: XCircle,
  evento_cancelado: XCircle,
  asignacion_personal: Users,
  checklist_completado: CheckCircle2,
  recordatorio_evento: Clock,
  cambio_estado: AlertCircle,
  nuevo_preregistro: User,
  mensaje_importante: Mail,
};

const notificationColors: Record<string, string> = {
  nuevo_evento: "text-blue-600",
  evento_aprobado: "text-green-600",
  evento_rechazado: "text-red-600",
  evento_cancelado: "text-red-600",
  asignacion_personal: "text-purple-600",
  checklist_completado: "text-green-600",
  recordatorio_evento: "text-yellow-600",
  cambio_estado: "text-orange-600",
  nuevo_preregistro: "text-blue-600",
  mensaje_importante: "text-gray-600",
};

export default function NotificationsPanel({
  userId,
  open,
  onOpenChange,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byType: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/notifications?userId=${userId}&limit=50`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar las notificaciones");
      }

      setNotifications(data.notifications || []);
      setStats(data.stats || { total: 0, unread: 0, byType: {} });
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Error al marcar como leída");
      }

      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, leida: true } : notif
        )
      );

      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.leida);

      await Promise.all(
        unreadNotifications.map((notif) => markAsRead(notif.id))
      );
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  useEffect(() => {
    if (open && userId) {
      fetchNotifications();
    }
  }, [open, userId]);

  const getNotificationIcon = (tipo: string) => {
    const Icon = notificationIcons[tipo] || Bell;
    const color = notificationColors[tipo] || "text-gray-600";
    return <Icon className={`h-4 w-4 ${color}`} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Hace unos minutos";
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    if (diffInHours < 48) return "Ayer";
    return date.toLocaleDateString();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-96 sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notificaciones</span>
            {stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {stats.total} notificaciones • {stats.unread} sin leer
          </SheetDescription>
        </SheetHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {stats.unread > 0 && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          </div>
        )}

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-200px)]">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    notification.leida
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-blue-200 shadow-sm"
                  }`}
                  onClick={() =>
                    !notification.leida && markAsRead(notification.id)
                  }
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-sm font-medium ${
                            notification.leida
                              ? "text-gray-600"
                              : "text-gray-900"
                          }`}
                        >
                          {notification.titulo}
                        </h4>
                        {!notification.leida && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p
                        className={`text-sm mt-1 ${
                          notification.leida ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        {notification.mensaje}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        {notification.evento && (
                          <Badge variant="outline" className="text-xs">
                            Evento
                          </Badge>
                        )}
                        {notification.preregistro && (
                          <Badge variant="outline" className="text-xs">
                            Preregistro
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
