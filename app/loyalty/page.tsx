"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Gift, Star, Trophy, Award, Crown, Medal } from "lucide-react"

const loyaltyMembers = [
  {
    id: 1,
    workerName: "María Rodríguez",
    position: "Coordinador",
    points: 520,
    tier: "gold",
    totalEvents: 52,
    totalEarnings: 5200,
    joinDate: "2022-11-10",
    benefits: ["Bonificación 15%", "Prioridad en eventos", "Seguro médico"],
    nextTierPoints: 480,
  },
  {
    id: 2,
    workerName: "Ana García",
    position: "Mesero",
    points: 450,
    tier: "silver",
    totalEvents: 45,
    totalEarnings: 2250,
    joinDate: "2023-01-15",
    benefits: ["Bonificación 10%", "Prioridad en eventos"],
    nextTierPoints: 550,
  },
  {
    id: 3,
    workerName: "Carlos López",
    position: "Chef",
    points: 380,
    tier: "silver",
    totalEvents: 38,
    totalEarnings: 4750,
    joinDate: "2023-03-20",
    benefits: ["Bonificación 10%", "Prioridad en eventos"],
    nextTierPoints: 620,
  },
  {
    id: 4,
    workerName: "José Martín",
    position: "Bartender",
    points: 290,
    tier: "bronze",
    totalEvents: 29,
    totalEarnings: 1450,
    joinDate: "2023-06-05",
    benefits: ["Bonificación 5%"],
    nextTierPoints: 210,
  },
]

const tierConfig = {
  bronze: {
    name: "Bronce",
    icon: Medal,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    minPoints: 0,
    maxPoints: 499,
    benefits: ["Bonificación 5%", "Acceso a eventos básicos"],
  },
  silver: {
    name: "Plata",
    icon: Award,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    minPoints: 500,
    maxPoints: 999,
    benefits: ["Bonificación 10%", "Prioridad en eventos", "Descuentos en capacitación"],
  },
  gold: {
    name: "Oro",
    icon: Trophy,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    minPoints: 1000,
    maxPoints: 1999,
    benefits: ["Bonificación 15%", "Prioridad máxima", "Seguro médico", "Vacaciones pagadas"],
  },
  platinum: {
    name: "Platino",
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    minPoints: 2000,
    maxPoints: Number.POSITIVE_INFINITY,
    benefits: ["Bonificación 20%", "Eventos exclusivos", "Seguro completo", "Plan de retiro"],
  },
}

export default function LoyaltyPage() {
  const getTierIcon = (tier: string) => {
    const config = tierConfig[tier as keyof typeof tierConfig]
    const IconComponent = config.icon
    return <IconComponent className={`w-5 h-5 ${config.color}`} />
  }

  const getTierProgress = (points: number, tier: string) => {
    const config = tierConfig[tier as keyof typeof tierConfig]
    const progress = ((points - config.minPoints) / (config.maxPoints - config.minPoints)) * 100
    return Math.min(progress, 100)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Programa de Lealtad</h2>
        <Button>
          <Gift className="w-4 h-4 mr-2" />
          Configurar Beneficios
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros Activos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loyaltyMembers.length}</div>
            <p className="text-xs text-muted-foreground">Trabajadores en el programa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loyaltyMembers.reduce((acc, member) => acc + member.points, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Puntos acumulados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros Oro+</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loyaltyMembers.filter((m) => m.tier === "gold" || m.tier === "platinum").length}
            </div>
            <p className="text-xs text-muted-foreground">Nivel premium</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficios Activos</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loyaltyMembers.reduce((acc, member) => acc + member.benefits.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total de beneficios</p>
          </CardContent>
        </Card>
      </div>

      {/* Niveles del programa */}
      <Card>
        <CardHeader>
          <CardTitle>Niveles del Programa</CardTitle>
          <CardDescription>Estructura de beneficios por nivel de lealtad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(tierConfig).map(([key, config]) => (
              <Card key={key} className={`border-2 ${config.bgColor}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <config.icon className={`w-6 h-6 ${config.color}`} />
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                  </div>
                  <CardDescription>
                    {config.minPoints} - {config.maxPoints === Number.POSITIVE_INFINITY ? "∞" : config.maxPoints} puntos
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {config.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-current rounded-full" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de miembros */}
      <Card>
        <CardHeader>
          <CardTitle>Miembros del Programa</CardTitle>
          <CardDescription>Estado actual de todos los trabajadores en el programa de lealtad</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabajador</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Beneficios</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loyaltyMembers.map((member) => {
                const tierInfo = tierConfig[member.tier as keyof typeof tierConfig]
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback>
                            {member.workerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.workerName}</div>
                          <div className="text-sm text-muted-foreground">{member.position}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTierIcon(member.tier)}
                        <Badge className={tierInfo.bgColor}>{tierInfo.name}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.points} pts</div>
                        <div className="text-sm text-muted-foreground">
                          {member.nextTierPoints} para siguiente nivel
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Progress value={getTierProgress(member.points, member.tier)} className="w-20" />
                        <div className="text-xs text-muted-foreground">
                          {getTierProgress(member.points, member.tier).toFixed(0)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.totalEvents}</div>
                        <div className="text-sm text-muted-foreground">€{member.totalEarnings.toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {member.benefits.slice(0, 2).map((benefit, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                        {member.benefits.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.benefits.length - 2} más
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
