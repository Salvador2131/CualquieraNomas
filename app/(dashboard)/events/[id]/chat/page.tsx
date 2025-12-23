"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase";

interface Message {
  id: string;
  message: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

interface Event {
  id: string;
  titulo: string;
  fecha_evento: string;
  hora_inicio?: string;
  hora_fin?: string;
  ubicacion?: string;
}

export default function EventChatPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchEventData();
    fetchMessages();
    setupRealtimeSubscription();
    getCurrentUserId();

    return () => {
      // Cleanup subscription on unmount
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [eventId]);

  let subscription: any = null;

  const getCurrentUserId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (err) {
      console.error("Error getting current user:", err);
    }
  };

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar evento");
      }

      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/chat`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar mensajes");
      }

      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      subscription = supabase
        .channel(`event-chat-${eventId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "event_chats",
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            // Fetch updated messages when new message is inserted
            fetchMessages();
          }
        )
        .subscribe();

      console.log("Realtime subscription set up");
    } catch (err) {
      console.error("Error setting up realtime subscription:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${eventId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al enviar mensaje");
      }

      // Agregar mensaje a la lista localmente
      if (data.chatMessage) {
        setMessages([...messages, data.chatMessage]);
      }

      setNewMessage("");
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading && !event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando chat...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{event?.titulo || "Chat del Evento"}</h1>
          <p className="text-sm text-muted-foreground">
            {event?.fecha_evento && new Date(event.fecha_evento).toLocaleDateString()}
            {event?.ubicacion && ` • ${event.ubicacion}`}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col mb-4">
        <CardHeader>
          <CardTitle>Mensajes</CardTitle>
          <CardDescription>
            Chat grupal para coordinar el evento
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                No hay mensajes aún. Sé el primero en escribir.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = currentUserId === msg.users?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="text-xs font-semibold mb-1 opacity-80">
                          {msg.users?.name || "Usuario"}
                        </div>
                      )}
                      <div className="text-sm">{msg.message}</div>
                      <div
                        className={`text-xs mt-1 ${
                          isOwnMessage ? "opacity-70" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={sending}
              maxLength={1000}
            />
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
