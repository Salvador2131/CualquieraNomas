"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingFormProps {
  eventId: string;
  workerId: string;
  workerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RatingForm({
  eventId,
  workerId,
  workerName,
  open,
  onOpenChange,
  onSuccess,
}: RatingFormProps) {
  const [score, setScore] = useState<number>(0);
  const [hoveredScore, setHoveredScore] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (score === 0) {
      setError("Por favor selecciona una calificación");
      return;
    }

    if (comment.trim().length < 10) {
      setError("El comentario debe tener al menos 10 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${eventId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worker_id: workerId,
          score,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al crear calificación");
      }

      // Reset form
      setScore(0);
      setComment("");
      setHoveredScore(0);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setScore(0);
      setComment("");
      setHoveredScore(0);
      setError("");
      onOpenChange(false);
    }
  };

  const displayScore = hoveredScore || score;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Calificar Trabajador</DialogTitle>
          <DialogDescription>
            Califica a {workerName} por su trabajo en este evento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Stars */}
          <div className="space-y-2">
            <Label>Calificación</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setScore(star)}
                  onMouseEnter={() => setHoveredScore(star)}
                  onMouseLeave={() => setHoveredScore(0)}
                  className="focus:outline-none"
                  disabled={loading}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= displayScore
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-300",
                      loading && "opacity-50 cursor-not-allowed"
                    )}
                  />
                </button>
              ))}
              {score > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {score}/5
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              Comentario <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="comment"
              placeholder="Escribe un comentario sobre el trabajo realizado (mínimo 10 caracteres)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              disabled={loading}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/10 caracteres mínimos
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || score === 0 || comment.trim().length < 10}
            >
              {loading ? "Enviando..." : "Enviar Calificación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
