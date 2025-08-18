import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Simulación de base de datos de usuarios
const users = [
  {
    id: 1,
    email: "admin@banquetes.com",
    password_hash: "$2b$10$example_hash",
    first_name: "Admin",
    last_name: "Sistema",
    user_type: "admin",
  },
  {
    id: 2,
    email: "ana.garcia@email.com",
    password_hash: "$2b$10$example_hash",
    first_name: "Ana",
    last_name: "García",
    user_type: "worker",
  },
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validar datos de entrada
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Buscar usuario
    const user = users.find((u) => u.email === email)
    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Verificar contraseña (en producción usar bcrypt.compare)
    // const isValidPassword = await bcrypt.compare(password, user.password_hash)
    const isValidPassword = password === "password123" // Simplificado para demo

    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.user_type,
      },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "24h" },
    )

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
