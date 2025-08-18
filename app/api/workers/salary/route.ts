import { type NextRequest, NextResponse } from "next/server"

interface SalaryCalculation {
  workerId: number
  eventId: number
  hoursWorked: number
  hourlyRate: number
  bonuses?: number
  deductions?: number
}

export async function POST(request: NextRequest) {
  try {
    const {
      workerId,
      eventId,
      hoursWorked,
      hourlyRate,
      bonuses = 0,
      deductions = 0,
    }: SalaryCalculation = await request.json()

    // Validar datos de entrada
    if (!workerId || !eventId || !hoursWorked || !hourlyRate) {
      return NextResponse.json({ error: "Faltan datos requeridos para el cálculo" }, { status: 400 })
    }

    // Cálculo base
    const baseSalary = hoursWorked * hourlyRate

    // Cálculo de horas extra (después de 8 horas)
    const overtimeHours = Math.max(0, hoursWorked - 8)
    const overtimePay = overtimeHours * hourlyRate * 0.5 // 50% extra por horas extra

    // Cálculo de impuestos (simplificado)
    const grossSalary = baseSalary + overtimePay + bonuses
    const taxRate = grossSalary > 1000 ? 0.15 : 0.1 // 15% si gana más de 1000€, sino 10%
    const taxes = grossSalary * taxRate

    // Seguridad social (6.35% del salario bruto)
    const socialSecurity = grossSalary * 0.0635

    // Salario neto
    const netSalary = grossSalary - taxes - socialSecurity - deductions

    const salaryBreakdown = {
      workerId,
      eventId,
      hoursWorked,
      hourlyRate,
      baseSalary: Number(baseSalary.toFixed(2)),
      overtimeHours: Number(overtimeHours.toFixed(2)),
      overtimePay: Number(overtimePay.toFixed(2)),
      bonuses: Number(bonuses.toFixed(2)),
      grossSalary: Number(grossSalary.toFixed(2)),
      taxes: Number(taxes.toFixed(2)),
      socialSecurity: Number(socialSecurity.toFixed(2)),
      deductions: Number(deductions.toFixed(2)),
      netSalary: Number(netSalary.toFixed(2)),
      calculatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      salary: salaryBreakdown,
    })
  } catch (error) {
    console.error("Error calculando salario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get("workerId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    // Simulación de historial de salarios
    const salaryHistory = [
      {
        id: 1,
        workerId: 2,
        eventId: 1,
        month: "2024-01",
        hoursWorked: 32,
        grossSalary: 520.0,
        netSalary: 442.0,
        status: "paid",
      },
      {
        id: 2,
        workerId: 2,
        eventId: 2,
        month: "2024-01",
        hoursWorked: 20,
        grossSalary: 300.0,
        netSalary: 255.0,
        status: "pending",
      },
    ]

    let filteredHistory = salaryHistory

    if (workerId) {
      filteredHistory = filteredHistory.filter((record) => record.workerId === Number.parseInt(workerId))
    }

    if (month && year) {
      const searchDate = `${year}-${month.padStart(2, "0")}`
      filteredHistory = filteredHistory.filter((record) => record.month === searchDate)
    }

    return NextResponse.json({
      success: true,
      salaryHistory: filteredHistory,
    })
  } catch (error) {
    console.error("Error obteniendo historial de salarios:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
