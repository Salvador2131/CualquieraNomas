import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/services/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, to, variables } = body;

    // Validar campos requeridos
    if (!template || !to) {
      return NextResponse.json(
        { message: "template y to son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si el servicio de email está configurado
    if (!emailService.isEmailConfigured()) {
      return NextResponse.json(
        {
          message: "Servicio de email no configurado",
          configured: false,
        },
        { status: 503 }
      );
    }

    const success = await emailService.sendTemplateEmail(
      template,
      to,
      variables || {}
    );

    if (!success) {
      return NextResponse.json(
        { message: "Error al enviar el email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Email enviado exitosamente",
      configured: true,
    });
  } catch (error) {
    console.error("Error in email send API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get("to");

    if (!to) {
      return NextResponse.json(
        { message: "Parámetro 'to' es requerido" },
        { status: 400 }
      );
    }

    // Verificar si el servicio de email está configurado
    if (!emailService.isEmailConfigured()) {
      return NextResponse.json(
        {
          message: "Servicio de email no configurado",
          configured: false,
        },
        { status: 503 }
      );
    }

    const success = await emailService.sendTestEmail(to);

    if (!success) {
      return NextResponse.json(
        { message: "Error al enviar el email de prueba" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Email de prueba enviado exitosamente",
      configured: true,
    });
  } catch (error) {
    console.error("Error in email test API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
