import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")

    let query = supabase
      .from("employers")
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
      .order("total_spent", { ascending: false })

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
    console.error("Error fetching employers:", error)
    return NextResponse.json({ error: "Error fetching employers" }, { status: 500 })
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
          user_type: "employer",
          phone: body.phone,
          address: body.address,
        },
      ])
      .select()

    if (userError) throw userError

    // Luego crear el empleador
    const { data: employerData, error: employerError } = await supabase
      .from("employers")
      .insert([
        {
          user_id: userData[0].id,
          company_name: body.company_name,
          company_website: body.company_website,
          business_type: body.business_type,
        },
      ])
      .select()

    if (employerError) throw employerError

    return NextResponse.json(employerData[0], { status: 201 })
  } catch (error) {
    console.error("Error creating employer:", error)
    return NextResponse.json({ error: "Error creating employer" }, { status: 500 })
  }
}
