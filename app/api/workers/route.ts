import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const specialization = searchParams.get("specialization")
    const limit = searchParams.get("limit")

    let query = supabase
      .from("workers")
      .select(`
        *,
        users (
          first_name,
          last_name,
          email,
          phone,
          address
        )
      `)
      .order("rating", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("availability_status", status)
    }

    if (specialization && specialization !== "all") {
      query = query.eq("specialization", specialization)
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit))
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching workers:", error)
    return NextResponse.json({ error: "Error fetching workers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Primero crear el usuario
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([
        {
          email: body.email,
          first_name: body.first_name,
          last_name: body.last_name,
          user_type: "worker",
          phone: body.phone,
          address: body.address,
        },
      ])
      .select()

    if (userError) throw userError

    // Luego crear el trabajador
    const { data: workerData, error: workerError } = await supabase
      .from("workers")
      .insert([
        {
          user_id: userData[0].id,
          specialization: body.specialization,
          hourly_rate: body.hourly_rate,
          experience_years: body.experience_years,
        },
      ])
      .select()

    if (workerError) throw workerError

    return NextResponse.json(workerData[0], { status: 201 })
  } catch (error) {
    console.error("Error creating worker:", error)
    return NextResponse.json({ error: "Error creating worker" }, { status: 500 })
  }
}
