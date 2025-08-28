"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Users, Building2, DollarSign, Star, TrendingUp, RefreshCw } from "lucide-react"

interface DashboardStats {
  users: {
    total: number
    workers: number
    employers: number
  }
  events: {
    total: number
    active: number
    completed: number
    averageBudget: number
  }
  revenue: {
    total: number
    employerSpent: number
  }
  ratings: {
    averageWorker: number
  }
  error?: boolean
  message?: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard") // Updated URL here

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON")
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      setStats({
        users: { total: 0, workers: 0, employers: 0 },
        events: { total: 0, active: 0, completed: 0, averageBudget: 0 },
        revenue: { total: 0, employerSpent: 0 },
        ratings: { averageWorker: 0 },
        error: true,
        message: "Error de conexión. Verifique la configuración del servidor.",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardStats()
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {stats?.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error de Conexión</CardTitle>
            <CardDescription className="text-red-600">{stats.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              Para configurar la base de datos, ejecute los siguientes scripts en Supabase SQL Editor:
            </p>
            <ol className="list-decimal list-inside mt-2 text-sm text-red-700 space-y-1">
              <li>
                <code className="bg-red-100 px-2 py-1 rounded">scripts/create-tables.sql</code>
              </li>
              <li>
                <code className="bg-red-100 px-2 py-1 rounded">scripts/insert-data.sql</code>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {stats?.message && !stats.error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Información</CardTitle>
            <CardDescription className="text-yellow-600">{stats.message}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.users.workers || 0} trabajadores, {stats?.users.employers || 0} empleadores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Totales</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.events.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.events.active || 0} activos, {stats?.events.completed || 0} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.revenue.total?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Promedio por evento: ${stats?.events.averageBudget?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.ratings.averageWorker || 0}/5</div>
            <p className="text-xs text-muted-foreground">Calificación de trabajadores</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Empleadores Activos</p>
                  <p className="text-sm text-muted-foreground">{stats?.users.employers || 0} empresas registradas</p>
                </div>
                <div className="ml-auto font-medium">{stats?.users.employers || 0}</div>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-green-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Trabajadores Disponibles</p>
                  <p className="text-sm text-muted-foreground">Personal especializado</p>
                </div>
                <div className="ml-auto font-medium">{stats?.users.workers || 0}</div>
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Gasto Total Empleadores</p>
                  <p className="text-sm text-muted-foreground">Inversión total en eventos</p>
                </div>
                <div className="ml-auto font-medium">${stats?.revenue.employerSpent?.toLocaleString() || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Estados de Eventos</CardTitle>
            <CardDescription>Distribución actual de eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="default" className="mr-2">
                    Activos
                  </Badge>
                </div>
                <span className="font-medium">{stats?.events.active || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-2">
                    Completados
                  </Badge>
                </div>
                <span className="font-medium">{stats?.events.completed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Total
                  </Badge>
                </div>
                <span className="font-medium">{stats?.events.total || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
