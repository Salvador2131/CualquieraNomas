"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationsPanel from "@/components/notifications-panel";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Calculator,
  MessageSquare,
  Star,
  Gift,
  Settings,
  FileText,
  Plug,
  BarChart3,
  Menu,
  Camera,
  Bell,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Preregistros",
    href: "/preregistrations",
    icon: Calendar,
  },
  {
    name: "Eventos",
    href: "/events",
    icon: Calendar,
  },
  {
    name: "Trabajadores",
    href: "/workers",
    icon: Users,
  },
  {
    name: "Lealtad",
    href: "/loyalty",
    icon: Gift,
  },
  {
    name: "Evaluaciones",
    href: "/evaluations",
    icon: Star,
  },
  {
    name: "Reportes",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Calendario",
    href: "/calendar",
    icon: Calendar,
  },
  {
    name: "Mensajes",
    href: "/messages",
    icon: MessageSquare,
  },
  {
    name: "Documentos",
    href: "/documents",
    icon: FileText,
  },
  {
    name: "Integraciones",
    href: "/integrations",
    icon: Plug,
  },
];

function SidebarContent() {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Obtener userId del localStorage o sessionStorage
  useEffect(() => {
    const storedUserId =
      localStorage.getItem("userId") || sessionStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Obtener estadísticas de notificaciones
  useEffect(() => {
    if (userId) {
      const fetchStats = async () => {
        try {
          const response = await fetch(
            `/api/notifications?userId=${userId}&limit=1`
          );
          const data = await response.json();
          if (response.ok) {
            setUnreadCount(data.stats?.unread || 0);
          }
        } catch (error) {
          console.error("Error fetching notification stats:", error);
        }
      };

      fetchStats();
      // Actualizar cada 30 segundos
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Calendar className="h-6 w-6" />
          <span className="">ERP Banquetes</span>
        </Link>

        {/* Botón de Notificaciones */}
        {userId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsOpen(true)}
            className="ml-auto relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notificaciones</span>
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Panel de Notificaciones */}
      {userId && (
        <NotificationsPanel
          userId={userId}
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
        />
      )}
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden bg-transparent"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
