import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validar datos de entrada
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Autenticar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Obtener información adicional del usuario desde la tabla users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Error al obtener datos del usuario" }, { status: 500 })
    }

    // Generar JWT token personalizado
    const token = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        userType: userData.user_type,
      },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "24h" },
    )

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        userType: userData.user_type,
        phone: userData.phone,
        address: userData.address,
      },
      supabaseSession: authData.session,
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
