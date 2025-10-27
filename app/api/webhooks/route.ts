import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("integration_id");
    const isActive = searchParams.get("is_active");

    let query = supabase
      .from("webhooks")
      .select(
        `
        *,
        integration:integration_id (
          id,
          name,
          provider
        ),
        created_by_user:created_by (
          id,
          name,
          email
        )
      `
      )
      .order("created_at", { ascending: false });

    if (integrationId) {
      query = query.eq("integration_id", integrationId);
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data: webhooks, error } = await query;

    if (error) {
      console.error("Error fetching webhooks:", error);
      return NextResponse.json(
        { error: "Error al obtener webhooks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Error in webhooks API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const {
      name,
      url,
      events,
      secret_key,
      integration_id,
      retry_count = 3,
      timeout_seconds = 30,
      created_by,
    } = body;

    const { data: webhook, error } = await supabase
      .from("webhooks")
      .insert({
        name,
        url,
        events,
        secret_key,
        integration_id,
        retry_count,
        timeout_seconds,
        created_by,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating webhook:", error);
      return NextResponse.json(
        { error: "Error al crear webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error("Error in webhooks POST API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
