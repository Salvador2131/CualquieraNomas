"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  Calendar,
  Users,
  Building2,
  Calculator,
  MessageSquare,
  Star,
  Gift,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Calendario", href: "/calendar", icon: Calendar },
  { name: "Trabajadores", href: "/workers", icon: Users },
  { name: "Empleadores", href: "/employers", icon: Building2 },
  { name: "Cotizador", href: "/quote", icon: Calculator },
  { name: "Mensajes", href: "/messages", icon: MessageSquare },
  { name: "Calificaciones", href: "/ratings", icon: Star },
  { name: "Programa Lealtad", href: "/loyalty", icon: Gift },
  { name: "Configuración", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn("flex flex-col bg-card border-r transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">ERP Banquetes</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start", collapsed && "px-2")}
              >
                <item.icon className="w-5 h-5" />
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn("w-full justify-start p-2", collapsed && "px-2")}>
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-muted-foreground">admin@banquetes.com</p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
