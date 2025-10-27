import nodemailer from "nodemailer";
import { notificationService, EmailTemplate } from "./notification-service";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Configuración para desarrollo (Gmail)
      const config: EmailConfig = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || "",
        },
      };

      // Solo crear transporter si tenemos credenciales
      if (config.auth.user && config.auth.pass) {
        this.transporter = nodemailer.createTransporter(config);
        this.isConfigured = true;
        console.log("Email service configured successfully");
      } else {
        console.warn("Email service not configured - missing SMTP credentials");
      }
    } catch (error) {
      console.error("Error initializing email service:", error);
    }
  }

  /**
   * Verificar si el servicio de email está configurado
   */
  isEmailConfigured(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Enviar email usando plantilla
   */
  async sendTemplateEmail(
    templateName: string,
    to: string,
    variables: Record<string, string>
  ): Promise<boolean> {
    try {
      if (!this.isEmailConfigured()) {
        console.warn("Email service not configured, skipping email send");
        return false;
      }

      // Obtener plantilla
      const template = await notificationService.getEmailTemplate(templateName);
      if (!template) {
        console.error(`Email template '${templateName}' not found`);
        return false;
      }

      // Procesar plantilla con variables
      const { asunto, contenido_html, contenido_texto } =
        notificationService.processEmailTemplate(template, variables);

      // Enviar email
      return await this.sendEmail({
        to,
        subject: asunto,
        html: contenido_html,
        text: contenido_texto,
      });
    } catch (error) {
      console.error("Error sending template email:", error);
      return false;
    }
  }

  /**
   * Enviar email directo
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.isEmailConfigured()) {
        console.warn("Email service not configured, skipping email send");
        return false;
      }

      const mailOptions = {
        from: `"ERP Banquetes" <${process.env.SMTP_USER}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      const result = await this.transporter!.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Enviar notificación de nuevo preregistro a administradores
   */
  async sendNewPreregistrationNotification(
    preregistroId: string
  ): Promise<boolean> {
    try {
      // Obtener datos del preregistro
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();

      const { data: preregistro, error: preregistroError } = await supabase
        .from("preregistrations")
        .select("*")
        .eq("id", preregistroId)
        .single();

      if (preregistroError || !preregistro) {
        console.error("Error fetching preregistration:", preregistroError);
        return false;
      }

      // Obtener administradores
      const { data: admins, error: adminsError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "admin");

      if (adminsError || !admins) {
        console.error("Error fetching admins:", adminsError);
        return false;
      }

      // Enviar email a cada administrador
      const emailPromises = admins.map((admin) => {
        const variables = {
          admin_nombre: admin.name,
          evento_titulo: preregistro.tipo_evento,
          cliente_nombre: preregistro.nombre_completo,
          cliente_email: preregistro.email,
          cliente_telefono: preregistro.telefono || "No proporcionado",
          evento_fecha: new Date(
            preregistro.fecha_estimada
          ).toLocaleDateString(),
          evento_invitados: preregistro.numero_invitados.toString(),
          evento_presupuesto: (
            preregistro.presupuesto_estimado || 0
          ).toString(),
          admin_dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/preregistrations`,
        };

        return this.sendTemplateEmail(
          "nuevo_preregistro_admin",
          admin.email,
          variables
        );
      });

      const results = await Promise.all(emailPromises);
      return results.every((result) => result);
    } catch (error) {
      console.error("Error sending preregistration notification:", error);
      return false;
    }
  }

  /**
   * Enviar notificación de evento aprobado al cliente
   */
  async sendEventApprovedNotification(
    preregistroId: string,
    eventoId: string
  ): Promise<boolean> {
    try {
      // Obtener datos del preregistro
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();

      const { data: preregistro, error: preregistroError } = await supabase
        .from("preregistrations")
        .select("*")
        .eq("id", preregistroId)
        .single();

      if (preregistroError || !preregistro) {
        console.error("Error fetching preregistration:", preregistroError);
        return false;
      }

      // Obtener datos del evento
      const { data: evento, error: eventoError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventoId)
        .single();

      if (eventoError || !evento) {
        console.error("Error fetching event:", eventoError);
        return false;
      }

      const variables = {
        cliente_nombre: preregistro.nombre_completo,
        evento_titulo: evento.titulo,
        evento_fecha: new Date(evento.fecha_evento).toLocaleDateString(),
        evento_hora: evento.hora_inicio || "Por confirmar",
        evento_ubicacion: evento.ubicacion,
        evento_invitados: evento.numero_invitados.toString(),
        contacto_url: `${process.env.NEXT_PUBLIC_APP_URL}/contacto`,
      };

      return await this.sendTemplateEmail(
        "evento_aprobado_cliente",
        preregistro.email,
        variables
      );
    } catch (error) {
      console.error("Error sending event approved notification:", error);
      return false;
    }
  }

  /**
   * Enviar notificación de nuevo evento a trabajadores
   */
  async sendNewEventNotification(
    eventoId: string,
    workerEmails: string[]
  ): Promise<boolean> {
    try {
      // Obtener datos del evento
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();

      const { data: evento, error: eventoError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventoId)
        .single();

      if (eventoError || !evento) {
        console.error("Error fetching event:", eventoError);
        return false;
      }

      // Enviar email a cada trabajador
      const emailPromises = workerEmails.map((email) => {
        const variables = {
          worker_nombre: "Trabajador", // Se podría obtener el nombre del usuario
          evento_titulo: evento.titulo,
          evento_fecha: new Date(evento.fecha_evento).toLocaleDateString(),
          evento_hora: evento.hora_inicio || "Por confirmar",
          evento_ubicacion: evento.ubicacion,
          evento_invitados: evento.numero_invitados.toString(),
          worker_rol: "Asignado",
          dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/worker-dashboard`,
        };

        return this.sendTemplateEmail("nuevo_evento_worker", email, variables);
      });

      const results = await Promise.all(emailPromises);
      return results.every((result) => result);
    } catch (error) {
      console.error("Error sending new event notification:", error);
      return false;
    }
  }

  /**
   * Enviar email de prueba
   */
  async sendTestEmail(to: string): Promise<boolean> {
    try {
      const testEmail = {
        to,
        subject: "Prueba de Email - ERP Banquetes",
        html: `
          <h2>Prueba de Email</h2>
          <p>Este es un email de prueba del sistema ERP Banquetes.</p>
          <p>Si recibes este email, el sistema de notificaciones está funcionando correctamente.</p>
          <p>Fecha: ${new Date().toLocaleString()}</p>
        `,
        text: `
          Prueba de Email - ERP Banquetes
          
          Este es un email de prueba del sistema ERP Banquetes.
          Si recibes este email, el sistema de notificaciones está funcionando correctamente.
          
          Fecha: ${new Date().toLocaleString()}
        `,
      };

      return await this.sendEmail(testEmail);
    } catch (error) {
      console.error("Error sending test email:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
