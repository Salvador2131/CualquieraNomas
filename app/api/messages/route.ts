import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");
    const userId = searchParams.get("user_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("messages")
      .select(`
        *,
        sender:sender_id (
          id,
          name,
          email
        ),
        reply_to:reply_to_id (
          id,
          content,
          sender_id
        ),
        attachments:message_attachments (
          id,
          file_name,
          file_type,
          file_size
        ),
        reactions:message_reactions (
          id,
          reaction_type,
          user_id
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (conversationId) {
      query = query.eq("conversation_id", conversationId);
    }

    if (userId) {
      query = query.eq("sender_id", userId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Error al obtener mensajes" },
        { status: 500 }
      );
    }

    // Obtener total de mensajes
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in messages API:", error);
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
      conversation_id,
      sender_id,
      content,
      message_type = "text",
      metadata = {},
      reply_to_id,
    } = body;

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_id,
        content,
        message_type,
        metadata,
        reply_to_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating message:", error);
      return NextResponse.json(
        { error: "Error al crear mensaje" },
        { status: 500 }
      );
    }

    // Actualizar última actividad de la conversación
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation_id);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error in messages POST API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
