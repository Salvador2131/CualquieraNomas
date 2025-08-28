import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")

    let query = supabase
      .from("events")
      .select(`
        *,
        employers (
          company_name,
          users (
            first_name,
            last_name,
            email
          )
        )
      `)
      .order("event_date", { ascending: true })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit))
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Error fetching events" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await supabase.from("events").insert([body]).select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Error creating event" }, { status: 500 })
  }
}
