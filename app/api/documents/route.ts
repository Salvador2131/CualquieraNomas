import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get("document_type");
    const category = searchParams.get("category");
    const searchTerm = searchParams.get("search");
    const userId = searchParams.get("user_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("documents")
      .select(`
        *,
        uploaded_by_user:uploaded_by (
          id,
          name,
          email
        ),
        event:event_id (
          id,
          titulo,
          fecha_evento
        ),
        worker:worker_id (
          id,
          name,
          email
        ),
        tags:document_tags (
          id,
          tag_name,
          tag_color
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (documentType) {
      query = query.eq("document_type", documentType);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,file_name.ilike.%${searchTerm}%`);
    }

    if (userId) {
      query = query.eq("uploaded_by", userId);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error("Error fetching documents:", error);
      return NextResponse.json(
        { error: "Error al obtener documentos" },
        { status: 500 }
      );
    }

    // Obtener total de documentos
    const { count } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in documents API:", error);
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
      file_name,
      file_path,
      file_type,
      file_size,
      mime_type,
      document_type,
      category,
      event_id,
      worker_id,
      uploaded_by,
      is_public = false,
      expires_at,
    } = body;

    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        title,
        description,
        file_name,
        file_path,
        file_type,
        file_size,
        mime_type,
        document_type,
        category,
        event_id,
        worker_id,
        uploaded_by,
        is_public,
        expires_at,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating document:", error);
      return NextResponse.json(
        { error: "Error al crear documento" },
        { status: 500 }
      );
    }

    // Crear log
    await supabase.from("document_logs").insert({
      document_id: document.id,
      action: "created",
      user_id: uploaded_by,
      details: {
        file_name,
        file_size,
        document_type,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Error in documents POST API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
