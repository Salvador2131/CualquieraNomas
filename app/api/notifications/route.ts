import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";
import {
  notificationSchema,
  paginationSchema,
} from "@/lib/validations/schemas";
import {
  validateRequest,
  createValidationErrorResponse,
} from "@/lib/middleware/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from "@/lib/api/response-handler";
import { mainSecurityMiddleware } from "@/lib/middleware";
import { apiLogger } from "@/lib/logger";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Validar parámetros de consulta
  const { searchParams } = new URL(request.url);
  const queryParams = {
    userId: searchParams.get("userId"),
    limit: parseInt(searchParams.get("limit") || "50"),
  };

  if (!queryParams.userId) {
    return createValidationErrorResponse(
      [{ field: "userId", message: "userId es requerido" }],
      "Parámetros inválidos"
    );
  }

  const limitValidation = validateRequest(paginationSchema, {
    limit: queryParams.limit,
  });
  if (!limitValidation.success) {
    return createValidationErrorResponse(
      limitValidation.details,
      "Parámetros de paginación inválidos"
    );
  }

  // 3. Obtener notificaciones
  try {
    const notifications = await notificationService.getUserNotifications(
      queryParams.userId,
      limitValidation.data.limit
    );
    const stats = await notificationService.getNotificationStats(
      queryParams.userId
    );

    // 4. Log de éxito
    apiLogger.info("Notifications fetched successfully", {
      userId: queryParams.userId,
      count: notifications?.length || 0,
      limit: limitValidation.data.limit,
    });

    return createSuccessResponse(
      {
        notifications: notifications || [],
        stats: stats || {},
      },
      "Notificaciones obtenidas correctamente"
    );
  } catch (error) {
    apiLogger.error("Error fetching notifications", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: queryParams.userId,
    });

    return createErrorResponse(error, "Error al obtener las notificaciones");
  }
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // 1. Verificaciones de seguridad
  const securityResponse = await mainSecurityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Obtener y validar datos del body
  const body = await request.json();
  const validation = validateRequest(notificationSchema, body);

  if (!validation.success) {
    return createValidationErrorResponse(
      validation.details,
      "Datos de notificación inválidos"
    );
  }

  const validatedData = validation.data;

  // 3. Crear notificación
  try {
    const notification = await notificationService.createNotification({
      destinatario_id: validatedData.user_id,
      destinatario_tipo: "user",
      destinatario_email: null,
      titulo: validatedData.title,
      mensaje: validatedData.message,
      tipo: validatedData.type,
      evento_id: null,
      preregistro_id: null,
      datos_adicionales: validatedData.data,
    });

    if (!notification) {
      return createErrorResponse(
        new Error("Failed to create notification"),
        "Error al crear la notificación"
      );
    }

    // 4. Log de éxito
    apiLogger.info("Notification created successfully", {
      notificationId: notification.id,
      userId: validatedData.user_id,
      type: validatedData.type,
    });

    return createSuccessResponse(
      {
        notification,
        message: "Notificación creada exitosamente",
      },
      "Notificación creada correctamente",
      201
    );
  } catch (error) {
    apiLogger.error("Error creating notification", {
      error: error instanceof Error ? error.message : "Unknown error",
      data: validatedData,
    });

    return createErrorResponse(error, "Error al crear la notificación");
  }
});
