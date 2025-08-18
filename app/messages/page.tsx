"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, Plus, MessageSquare, Clock } from "lucide-react"

const conversations = [
  {
    id: 1,
    participant: {
      name: "Ana García",
      avatar: "/placeholder-user.jpg",
      status: "online",
    },
    lastMessage: "Confirmo mi disponibilidad para el evento del viernes",
    timestamp: "10:30",
    unread: 2,
    eventRelated: "Boda García-López",
  },
  {
    id: 2,
    participant: {
      name: "Carlos López",
      avatar: "/placeholder-user.jpg",
      status: "offline",
    },
    lastMessage: "¿Podemos revisar el menú para el evento corporativo?",
    timestamp: "09:15",
    unread: 0,
    eventRelated: "Evento TechCorp",
  },
  {
    id: 3,
    participant: {
      name: "María Rodríguez",
      avatar: "/placeholder-user.jpg",
      status: "online",
    },
    lastMessage: "Perfecto, nos vemos mañana a las 8:00",
    timestamp: "Ayer",
    unread: 1,
    eventRelated: null,
  },
]

const messages = [
  {
    id: 1,
    senderId: 1,
    content: "Hola, ¿cómo estás? Quería confirmar los detalles del evento del viernes.",
    timestamp: "10:25",
    isOwn: false,
  },
  {
    id: 2,
    senderId: 2,
    content:
      "¡Hola! Todo bien por aquí. Sí, confirmo mi disponibilidad para el evento. ¿A qué hora necesitas que esté?",
    timestamp: "10:27",
    isOwn: true,
  },
  {
    id: 3,
    senderId: 1,
    content: "Perfecto. Necesitamos que estés a las 17:00 para la preparación. El evento empieza a las 18:00.",
    timestamp: "10:28",
    isOwn: false,
  },
  {
    id: 4,
    senderId: 2,
    content: "Confirmo mi disponibilidad para el evento del viernes",
    timestamp: "10:30",
    isOwn: true,
  },
]

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(1)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredConversations = conversations.filter((conv) =>
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sendMessage = () => {
    if (newMessage.trim()) {
      // Aquí se enviaría el mensaje
      console.log("Enviando mensaje:", newMessage)
      setNewMessage("")
    }
  }

  return (
    <div className="flex-1 p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Mensajes</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Conversación
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 h-[calc(100vh-200px)]">
        {/* Lista de conversaciones */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Conversaciones</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedConversation === conversation.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={conversation.participant.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {conversation.participant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          conversation.participant.status === "online" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{conversation.participant.name}</p>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                          {conversation.unread > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">{conversation.lastMessage}</p>
                      {conversation.eventRelated && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {conversation.eventRelated}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat activo */}
        <Card className="md:col-span-2 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>AG</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">Ana García</CardTitle>
                <CardDescription className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>En línea</span>
                  <span>•</span>
                  <span>Boda García-López</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Mensajes */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] ${message.isOwn ? "order-2" : "order-1"}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div
                        className={`flex items-center mt-1 space-x-1 ${
                          message.isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input de mensaje */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Escribe tu mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 min-h-[40px] max-h-[120px]"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
