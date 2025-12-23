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
  organization_id?: string; // Agregar organization_id
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
   * Crear una nueva notificación y enviar email automáticamente
   */
  async createNotification(data: NotificationData) {
    try {
      // Obtener organization_id si no se proporciona
      let organizationId = data.organization_id;
      let userEmail: string | null = data.destinatario_email || null;

      if (!organizationId && data.destinatario_id) {
        const { data: user } = await this.supabase
          .from("users")
          .select("organization_id, email")
          .eq("id", data.destinatario_id)
          .single();
        organizationId =
          user?.organization_id || "00000000-0000-0000-0000-000000000001";
        if (!userEmail && user?.email) {
          userEmail = user.email;
        }
      } else if (!organizationId) {
        organizationId = "00000000-0000-0000-0000-000000000001";
      }

      // Si tenemos destinatario_id pero no email, obtenerlo
      if (!userEmail && data.destinatario_id) {
        const { data: user } = await this.supabase
          .from("users")
          .select("email")
          .eq("id", data.destinatario_id)
          .single();
        if (user?.email) {
          userEmail = user.email;
        }
      }

      const { data: notification, error } = await this.supabase
        .from("notifications")
        .insert([
          {
            destinatario_id: data.destinatario_id,
            destinatario_tipo: data.destinatario_tipo,
            destinatario_email: userEmail || data.destinatario_email,
            titulo: data.titulo,
            mensaje: data.mensaje,
            tipo: data.tipo,
            evento_id: data.evento_id,
            preregistro_id: data.preregistro_id,
            datos_adicionales: data.datos_adicionales,
            organization_id: organizationId,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating notification:", error);
        return null;
      }

      // Enviar email automáticamente si tenemos email
      if (userEmail || data.destinatario_email) {
        try {
          await emailService.sendEmail({
            to: userEmail || data.destinatario_email!,
            subject: data.titulo,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">${data.titulo}</h2>
                <p style="color: #666; line-height: 1.6;">${data.mensaje}</p>
                ${
                  data.evento_id
                    ? `<p style="margin-top: 20px;"><a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "http://localhost:3000"
                      }/events/${
                        data.evento_id
                      }" style="color: #007bff; text-decoration: none;">Ver evento</a></p>`
                    : ""
                }
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">Este es un email automático del sistema ERP Banquetes. Por favor no respondas a este correo.</p>
              </div>
            `,
            text: `${data.titulo}\n\n${data.mensaje}${
              data.evento_id
                ? `\n\nVer evento: ${
                    env.app.url
                  }/events/${data.evento_id}`
                : ""
            }`,
          });
        } catch (emailError) {
          console.error("Error sending notification email:", emailError);
          // No fallar la creación de notificación si el email falla
        }
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

      // Obtener organization_id del evento
      const organizationId =
        evento.organization_id || "00000000-0000-0000-0000-000000000001";

      // Crear notificaciones para cada trabajador (con organization_id)
      const notifications = workerIds.map((workerId) => ({
        destinatario_id: workerId,
        destinatario_tipo: "worker" as const,
        titulo: `Nuevo Evento: ${evento.titulo}`,
        mensaje: `Se te ha asignado un nuevo evento para el ${new Date(
          evento.fecha_evento
        ).toLocaleDateString()}`,
        tipo: "nuevo_evento",
        evento_id: eventoId,
        organization_id: organizationId, // Agregar organization_id
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

      // Obtener organization_id del preregistro o evento
      const organizationId =
        preregistro.organization_id ||
        evento.organization_id ||
        "00000000-0000-0000-0000-000000000001";

      // Crear notificación para el cliente (con organization_id)
      const notification = await this.createNotification({
        destinatario_tipo: "client",
        destinatario_email: preregistro.email,
        titulo: `Tu evento ha sido aprobado: ${evento.titulo}`,
        mensaje: `Tu solicitud de evento ha sido aprobada. Nuestro equipo se pondrá en contacto contigo pronto.`,
        tipo: "evento_aprobado",
        evento_id: eventoId,
        preregistro_id: preregistroId,
        organization_id: organizationId, // Agregar organization_id
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

      // Obtener organization_id del preregistro
      const organizationId =
        preregistro.organization_id || "00000000-0000-0000-0000-000000000001";

      // Obtener administradores de la misma organización
      const { data: admins, error: adminsError } = await this.supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "admin")
        .eq("organization_id", organizationId);

      if (adminsError || !admins) {
        console.error("Error fetching admins:", adminsError);
        return false;
      }

      // Crear notificaciones para cada administrador (con organization_id)
      const notifications = admins.map((admin) => ({
        destinatario_id: admin.id,
        destinatario_tipo: "admin" as const,
        titulo: `Nueva solicitud de evento: ${preregistro.tipo_evento}`,
        mensaje: `${preregistro.nombre_completo} ha solicitado un ${
          preregistro.tipo_evento
        } para el ${new Date(preregistro.fecha_estimada).toLocaleDateString()}`,
        tipo: "nuevo_preregistro",
        preregistro_id: preregistroId,
        organization_id: organizationId, // Agregar organization_id
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
   * Obtener estadísticas de notificaciones (filtradas por organización)
   */
  async getNotificationStats(userId: string, organizationId?: string) {
    try {
      // Obtener organization_id del usuario si no se proporciona
      let orgId = organizationId;
      if (!orgId) {
        const { data: user } = await this.supabase
          .from("users")
          .select("organization_id")
          .eq("id", userId)
          .single();
        orgId = user?.organization_id;
      }

      let query = this.supabase
        .from("notifications")
        .select("leida, tipo")
        .or(`destinatario_id.eq.${userId},destinatario_email.eq.${userId}`);

      // Aplicar filtro de organización si está disponible
      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      const { data: stats, error } = await query;

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
