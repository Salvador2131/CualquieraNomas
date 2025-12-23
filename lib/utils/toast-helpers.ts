/**
 * Helpers para usar toast de forma consistente en toda la aplicación
 */
import { useToast } from "@/hooks/use-toast";

export const useToastHelpers = () => {
  const { toast } = useToast();

  return {
    success: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
      });
    },
    error: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
    info: (title: string, description?: string) => {
      toast({
        title,
        description,
      });
    },
    warning: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
      });
    },
  };
};

/**
 * Helper para mostrar errores de API de forma consistente
 */
export const showApiError = (
  toast: ReturnType<typeof useToast>["toast"],
  error: unknown,
  defaultMessage: string = "Ocurrió un error inesperado"
) => {
  let message = defaultMessage;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
  }

  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
};

/**
 * Helper para mostrar éxito de operaciones
 */
export const showSuccess = (
  toast: ReturnType<typeof useToast>["toast"],
  message: string,
  description?: string
) => {
  toast({
    title: "Éxito",
    description: description || message,
    variant: "default",
  });
};
