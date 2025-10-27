"use client";

import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Users,
  Calendar,
  FileText,
  Image,
  Smile,
  Clock,
  CheckCircle,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender: {
    name: string;
    email: string;
  };
  conversation: {
    id: string;
    title: string;
    conversation_type: string;
  };
  attachments?: {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
  }[];
  reactions?: {
    id: string;
    reaction_type: string;
    user_id: string;
  }[];
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [conversationFilter, setConversationFilter] = useState("all");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // Simular datos de mensajes
      const mockData: Message[] = [
        {
          id: "1",
          content: "Hola, ¿cómo va la preparación del evento de mañana?",
          message_type: "text",
          created_at: "2024-01-15T10:30:00Z",
          sender: {
            name: "María González",
            email: "maria@ejemplo.com",
          },
          conversation: {
            id: "conv1",
            title: "Evento Boda Ana y Carlos",
            conversation_type: "event",
          },
          attachments: [],
          reactions: [
            {
              id: "r1",
              reaction_type: "thumbs_up",
              user_id: "user1",
            },
          ],
        },
        {
          id: "2",
          content: "Adjunto el menú final para revisión",
          message_type: "file",
          created_at: "2024-01-15T11:15:00Z",
          sender: {
            name: "Carlos Rodríguez",
            email: "carlos@ejemplo.com",
          },
          conversation: {
            id: "conv1",
            title: "Evento Boda Ana y Carlos",
            conversation_type: "event",
          },
          attachments: [
            {
              id: "att1",
              file_name: "menu_final.pdf",
              file_type: "pdf",
              file_size: 1024000,
            },
          ],
          reactions: [],
        },
        {
          id: "3",
          content: "Recordatorio: Reunión de equipo a las 3 PM",
          message_type: "system",
          created_at: "2024-01-15T14:00:00Z",
          sender: {
            name: "Sistema",
            email: "system@ejemplo.com",
          },
          conversation: {
            id: "conv2",
            title: "Reuniones Generales",
            conversation_type: "group",
          },
          attachments: [],
          reactions: [],
        },
        {
          id: "4",
          content: "¡Excelente trabajo en el evento de ayer!",
          message_type: "text",
          created_at: "2024-01-14T16:45:00Z",
          sender: {
            name: "Ana Martínez",
            email: "ana@ejemplo.com",
          },
          conversation: {
            id: "conv3",
            title: "Feedback General",
            conversation_type: "group",
          },
          attachments: [],
          reactions: [
            {
              id: "r2",
              reaction_type: "love",
              user_id: "user2",
            },
            {
              id: "r3",
              reaction_type: "thumbs_up",
              user_id: "user3",
            },
          ],
        },
      ];
      setMessages(mockData);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.conversation.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || message.message_type === typeFilter;
    const matchesConversation =
      conversationFilter === "all" ||
      message.conversation.conversation_type === conversationFilter;

    return matchesSearch && matchesType && matchesConversation;
  });

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      text: {
        variant: "default" as const,
        label: "Texto",
        icon: MessageSquare,
      },
      image: { variant: "secondary" as const, label: "Imagen", icon: Image },
      file: { variant: "outline" as const, label: "Archivo", icon: FileText },
      system: { variant: "default" as const, label: "Sistema", icon: Clock },
      event_update: {
        variant: "secondary" as const,
        label: "Actualización",
        icon: Calendar,
      },
      notification: {
        variant: "outline" as const,
        label: "Notificación",
        icon: Clock,
      },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.text;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getConversationTypeBadge = (type: string) => {
    const typeConfig = {
      direct: { variant: "default" as const, label: "Directo", icon: Users },
      group: { variant: "secondary" as const, label: "Grupo", icon: Users },
      event: { variant: "outline" as const, label: "Evento", icon: Calendar },
      support: {
        variant: "default" as const,
        label: "Soporte",
        icon: MessageSquare,
      },
      announcement: {
        variant: "secondary" as const,
        label: "Anuncio",
        icon: MessageSquare,
      },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.direct;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getReactionIcon = (reactionType: string) => {
    const reactionIcons = {
      like: "👍",
      love: "❤️",
      laugh: "😂",
      wow: "😮",
      sad: "😢",
      angry: "😠",
      thumbs_up: "👍",
      thumbs_down: "👎",
    };

    return reactionIcons[reactionType as keyof typeof reactionIcons] || "👍";
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mensajes</h1>
          <p className="text-muted-foreground">
            Gestiona conversaciones y mensajes del sistema
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Conversación
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mensajes
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversaciones
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(messages.map((m) => m.conversation.id)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archivos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                messages.filter(
                  (m) => m.attachments && m.attachments.length > 0
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reacciones</CardTitle>
            <Smile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messages.reduce((sum, m) => sum + (m.reactions?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por contenido, remitente o conversación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="image">Imagen</SelectItem>
                <SelectItem value="file">Archivo</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="event_update">Actualización</SelectItem>
                <SelectItem value="notification">Notificación</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={conversationFilter}
              onValueChange={setConversationFilter}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Conversación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las conversaciones</SelectItem>
                <SelectItem value="direct">Directo</SelectItem>
                <SelectItem value="group">Grupo</SelectItem>
                <SelectItem value="event">Evento</SelectItem>
                <SelectItem value="support">Soporte</SelectItem>
                <SelectItem value="announcement">Anuncio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mensajes ({filteredMessages.length})</CardTitle>
          <CardDescription>
            Lista de todos los mensajes del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contenido</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Conversación</TableHead>
                <TableHead>Remitente</TableHead>
                <TableHead>Archivos</TableHead>
                <TableHead>Reacciones</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium truncate">
                        {message.content}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(message.message_type)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {message.conversation.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getConversationTypeBadge(
                          message.conversation.conversation_type
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{message.sender.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {message.sender.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {message.attachments && message.attachments.length > 0 ? (
                      <div className="space-y-1">
                        {message.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center space-x-1 text-sm"
                          >
                            <FileText className="h-3 w-3" />
                            <span className="truncate max-w-20">
                              {attachment.file_name}
                            </span>
                            <span className="text-muted-foreground">
                              ({formatFileSize(attachment.file_size)})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {message.reactions && message.reactions.length > 0 ? (
                      <div className="flex items-center space-x-1">
                        {message.reactions.map((reaction) => (
                          <span key={reaction.id} className="text-lg">
                            {getReactionIcon(reaction.reaction_type)}
                          </span>
                        ))}
                        <span className="text-sm text-muted-foreground">
                          ({message.reactions.length})
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(message.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredMessages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron mensajes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
