import { type NextRequest, NextResponse } from "next/server"

// Simulación de datos de eventos
const events = [
  {
    id: 1,
    title: "Boda García-López",
    date: "2024-01-15",
    time: "18:00",
    duration: "6 horas",
    guests: 120,
    location: "Salón Primavera",
    status: "confirmado",
    workers: 8,
    employerId: 6,
  },
  {
    id: 2,
    title: "Evento Corporativo TechCorp",
    date: "2024-01-16",
    time: "12:00",
    duration: "4 horas",
    guests: 80,
    location: "Hotel Plaza",
    status: "pendiente",
    workers: 5,
    employerId: 6,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const status = searchParams.get("status")

    let filteredEvents = events

    if (date) {
      filteredEvents = filteredEvents.filter((event) => event.date === date)
    }

    if (status) {
      filteredEvents = filteredEvents.filter((event) => event.status === status)
    }

    return NextResponse.json({
      success: true,
      events: filteredEvents,
    })
  } catch (error) {
    console.error("Error obteniendo eventos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json()

    // Validar datos requeridos
    const requiredFields = ["title", "date", "time", "guests", "location"]
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return NextResponse.json({ error: `El campo ${field} es requerido` }, { status: 400 })
      }
    }

    // Crear nuevo evento
    const newEvent = {
      id: events.length + 1,
      ...eventData,
      status: "draft",
      workers: 0,
      createdAt: new Date().toISOString(),
    }

    events.push(newEvent)

    return NextResponse.json(
      {
        success: true,
        event: newEvent,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creando evento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
