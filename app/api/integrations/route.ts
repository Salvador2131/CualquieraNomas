import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const integrationType = searchParams.get("integration_type");
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");

    let query = supabase
      .from("integrations")
      .select(
        `
        *,
        created_by_user:created_by (
          id,
          name,
          email
        )
      `
      )
      .order("created_at", { ascending: false });

    if (integrationType) {
      query = query.eq("integration_type", integrationType);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (provider) {
      query = query.eq("provider", provider);
    }

    const { data: integrations, error } = await query;

    if (error) {
      console.error("Error fetching integrations:", error);
      return NextResponse.json(
        { error: "Error al obtener integraciones" },
        { status: 500 }
      );
    }

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Error in integrations API:", error);
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
      integration_type,
      provider,
      configuration,
      credentials,
      webhook_url,
      api_endpoint,
      sync_frequency = 3600,
      created_by,
    } = body;

    const { data: integration, error } = await supabase
      .from("integrations")
      .insert({
        name,
        integration_type,
        provider,
        configuration,
        credentials,
        webhook_url,
        api_endpoint,
        sync_frequency,
        created_by,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating integration:", error);
      return NextResponse.json(
        { error: "Error al crear integración" },
        { status: 500 }
      );
    }

    return NextResponse.json({ integration }, { status: 201 });
  } catch (error) {
    console.error("Error in integrations POST API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
