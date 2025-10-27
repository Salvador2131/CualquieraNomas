import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const eventType = searchParams.get("event_type");
    const userId = searchParams.get("user_id");

    let query = supabase
      .from("calendar_events")
      .select(`
        *,
        created_by_user:created_by (
          id,
          name,
          email
        ),
        event:event_id (
          id,
          titulo,
          fecha_evento
        )
      `)
      .order("start_date", { ascending: true });

    if (startDate) {
      query = query.gte("start_date", startDate);
    }

    if (endDate) {
      query = query.lte("end_date", endDate);
    }

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (userId) {
      query = query.eq("created_by", userId);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching calendar events:", error);
      return NextResponse.json(
        { error: "Error al obtener eventos del calendario" },
        { status: 500 }
      );
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error in calendar API:", error);
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
      title,
      description,
      start_date,
      end_date,
      all_day = false,
      event_type,
      priority = "medium",
      location,
      attendees = [],
      recurring_rule,
      event_id,
      created_by,
    } = body;

    const { data: event, error } = await supabase
      .from("calendar_events")
      .insert({
        title,
        description,
        start_date,
        end_date,
        all_day,
        event_type,
        priority,
        location,
        attendees,
        recurring_rule,
        event_id,
        created_by,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating calendar event:", error);
      return NextResponse.json(
        { error: "Error al crear evento del calendario" },
        { status: 500 }
      );
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error in calendar POST API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
