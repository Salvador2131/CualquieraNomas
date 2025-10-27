import { createClient } from "@/lib/supabase";
import { emailService } from "./email-service";

export interface NotificationData {
  destinatario_id?: string;
  destinatario_tipo: "admin" | "worker" | "client";
  destinatario_email?: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  evento_id?: string;
  preregistro_id?: string;
  datos_adicionales?: any;
}

export interface EmailTemplate {
  id: string;
  nombre: string;
  asunto: string;
  contenido_html: string;
  contenido_texto: string;
  variables: string[];
}

class NotificationService {
  private supabase = createClient();

  /**
   * Crear una nueva notificación
   */
  async createNotification(data: NotificationData) {
    try {
      const { data: notification, error } = await this.supabase
        .from("notifications")
        .insert([
          {
            destinatario_id: data.destinatario_id,
            destinatario_tipo: data.destinatario_tipo,
            destinatario_email: data.destinatario_email,
            titulo: data.titulo,
            mensaje: data.mensaje,
            tipo: data.tipo,
            evento_id: data.evento_id,
            preregistro_id: data.preregistro_id,
            datos_adicionales: data.datos_adicionales,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating notification:", error);
        return null;
      }

      return notification;
    } catch (error) {
      console.error("Error in createNotification:", error);
      return null;
    }
  }

  /**
   * Obtener notificaciones para un usuario
   */
  async getUserNotifications(userId: string, limit = 50) {
    try {
      const { data: notifications, error } = await this.supabase
        .from("notifications")
        .select(
          `
          *,
          evento:events(id, titulo, fecha_evento),
          preregistro:preregistrations(id, nombre_completo, tipo_evento)
        `
        )
        .or(`destinatario_id.eq.${userId},destinatario_email.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }

      return notifications || [];
    } catch (error) {
      console.error("Error in getUserNotifications:", error);
      return [];
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({
          leida: true,
          fecha_lectura: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in markAsRead:", error);
      return false;
    }
  }

  /**
   * Obtener plantilla de email
   */
  async getEmailTemplate(templateName: string): Promise<EmailTemplate | null> {
    try {
      const { data: template, error } = await this.supabase
        .from("email_templates")
        .select("*")
        .eq("nombre", templateName)
        .eq("activa", true)
        .single();

      if (error) {
        console.error("Error fetching email template:", error);
        return null;
      }

      return template;
    } catch (error) {
      console.error("Error in getEmailTemplate:", error);
      return null;
    }
  }

  /**
   * Procesar plantilla de email con variables
   */
  processEmailTemplate(
    template: EmailTemplate,
    variables: Record<string, string>
  ): {
    asunto: string;
    contenido_html: string;
    contenido_texto: string;
  } {
    let asunto = template.asunto;
    let contenido_html = template.contenido_html;
    let contenido_texto = template.contenido_texto || "";

    // Reemplazar variables en el asunto
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      asunto = asunto.replace(regex, value);
    });

    // Reemplazar variables en el contenido HTML
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      contenido_html = contenido_html.replace(regex, value);
    });

    // Reemplazar variables en el contenido texto
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      contenido_texto = contenido_texto.replace(regex, value);
    });

    return { asunto, contenido_html, contenido_texto };
  }

  /**
   * Enviar notificación de nuevo evento a trabajadores
   */
  async notifyNewEventToWorkers(eventoId: string, workerIds: string[]) {
    try {
      // Obtener datos del evento
      const { data: evento, error: eventoError } = await this.supabase
        .from("events")
        .select("*")
        .eq("id", eventoId)
        .single();

      if (eventoError || !evento) {
        console.error("Error fetching event:", eventoError);
        return false;
      }

      // Crear notificaciones para cada trabajador
      const notifications = workerIds.map((workerId) => ({
        destinatario_id: workerId,
        destinatario_tipo: "worker" as const,
        titulo: `Nuevo Evento: ${evento.titulo}`,
        mensaje: `Se te ha asignado un nuevo evento para el ${new Date(
          evento.fecha_evento
        ).toLocaleDateString()}`,
        tipo: "nuevo_evento",
        evento_id: eventoId,
        datos_adicionales: {
          evento_titulo: evento.titulo,
          evento_fecha: new Date(evento.fecha_evento).toLocaleDateString(),
          evento_ubicacion: evento.ubicacion,
          evento_invitados: evento.numero_invitados,
        },
      }));

      const { error } = await this.supabase
        .from("notifications")
        .insert(notifications);

      if (error) {
        console.error("Error creating worker notifications:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in notifyNewEventToWorkers:", error);
      return false;
    }
  }

  /**
   * Enviar notificación de preregistro aprobado al cliente
   */
  async notifyPreregistrationApproved(preregistroId: string, eventoId: string) {
    try {
      // Obtener datos del preregistro
      const { data: preregistro, error: preregistroError } = await this.supabase
        .from("preregistrations")
        .select("*")
        .eq("id", preregistroId)
        .single();

      if (preregistroError || !preregistro) {
        console.error("Error fetching preregistration:", preregistroError);
        return false;
      }

      // Obtener datos del evento
      const { data: evento, error: eventoError } = await this.supabase
        .from("events")
        .select("*")
        .eq("id", eventoId)
        .single();

      if (eventoError || !evento) {
        console.error("Error fetching event:", eventoError);
        return false;
      }

      // Crear notificación para el cliente
      const notification = await this.createNotification({
        destinatario_tipo: "client",
        destinatario_email: preregistro.email,
        titulo: `Tu evento ha sido aprobado: ${evento.titulo}`,
        mensaje: `Tu solicitud de evento ha sido aprobada. Nuestro equipo se pondrá en contacto contigo pronto.`,
        tipo: "evento_aprobado",
        evento_id: eventoId,
        preregistro_id: preregistroId,
        datos_adicionales: {
          cliente_nombre: preregistro.nombre_completo,
          evento_titulo: evento.titulo,
          evento_fecha: new Date(evento.fecha_evento).toLocaleDateString(),
          evento_ubicacion: evento.ubicacion,
          evento_invitados: evento.numero_invitados,
        },
      });

      return !!notification;
    } catch (error) {
      console.error("Error in notifyPreregistrationApproved:", error);
      return false;
    }
  }

  /**
   * Enviar notificación de nuevo preregistro a administradores
   */
  async notifyNewPreregistrationToAdmins(preregistroId: string) {
    try {
      // Obtener datos del preregistro
      const { data: preregistro, error: preregistroError } = await this.supabase
        .from("preregistrations")
        .select("*")
        .eq("id", preregistroId)
        .single();

      if (preregistroError || !preregistro) {
        console.error("Error fetching preregistration:", preregistroError);
        return false;
      }

      // Obtener administradores
      const { data: admins, error: adminsError } = await this.supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "admin");

      if (adminsError || !admins) {
        console.error("Error fetching admins:", adminsError);
        return false;
      }

      // Crear notificaciones para cada administrador
      const notifications = admins.map((admin) => ({
        destinatario_id: admin.id,
        destinatario_tipo: "admin" as const,
        titulo: `Nueva solicitud de evento: ${preregistro.tipo_evento}`,
        mensaje: `${preregistro.nombre_completo} ha solicitado un ${
          preregistro.tipo_evento
        } para el ${new Date(preregistro.fecha_estimada).toLocaleDateString()}`,
        tipo: "nuevo_preregistro",
        preregistro_id: preregistroId,
        datos_adicionales: {
          cliente_nombre: preregistro.nombre_completo,
          cliente_email: preregistro.email,
          evento_titulo: preregistro.tipo_evento,
          evento_fecha: new Date(
            preregistro.fecha_estimada
          ).toLocaleDateString(),
          evento_invitados: preregistro.numero_invitados,
          evento_presupuesto: preregistro.presupuesto_estimado || 0,
        },
      }));

      const { error } = await this.supabase
        .from("notifications")
        .insert(notifications);

      if (error) {
        console.error("Error creating admin notifications:", error);
        return false;
      }

      // Enviar emails a administradores
      await emailService.sendNewPreregistrationNotification(preregistroId);

      return true;
    } catch (error) {
      console.error("Error in notifyNewPreregistrationToAdmins:", error);
      return false;
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats(userId: string) {
    try {
      const { data: stats, error } = await this.supabase
        .from("notifications")
        .select("leida, tipo")
        .or(`destinatario_id.eq.${userId},destinatario_email.eq.${userId}`);

      if (error) {
        console.error("Error fetching notification stats:", error);
        return { total: 0, unread: 0, byType: {} };
      }

      const total = stats?.length || 0;
      const unread = stats?.filter((n) => !n.leida).length || 0;
      const byType =
        stats?.reduce((acc, n) => {
          acc[n.tipo] = (acc[n.tipo] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      return { total, unread, byType };
    } catch (error) {
      console.error("Error in getNotificationStats:", error);
      return { total: 0, unread: 0, byType: {} };
    }
  }
}

export const notificationService = new NotificationService();
