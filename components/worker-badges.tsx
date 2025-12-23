"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkerBadgesProps {
  badges: string[];
  rating?: number;
  className?: string;
}

export function WorkerBadges({ badges, rating, className }: WorkerBadgesProps) {
  const badgeConfig: Record<
    string,
    {
      label: string;
      icon: typeof CheckCircle;
      variant: "default" | "secondary" | "outline";
    }
  > = {
    certified: {
      label: "Certificado Validado",
      icon: CheckCircle,
      variant: "default",
    },
    high_rating: {
      label: "4.5+ Rating",
      icon: Star,
      variant: "secondary",
    },
    perfect_attendance: {
      label: "100% Asistencias",
      icon: Award,
      variant: "outline",
    },
  };

  if (badges.length === 0 && !rating) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((badge) => {
        const config = badgeConfig[badge];
        if (!config) return null;

        const Icon = config.icon;
        return (
          <Badge key={badge} variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      })}
      {rating !== undefined && rating > 0 && (
        <Badge variant="outline" className="gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {rating.toFixed(1)}/5
        </Badge>
      )}
    </div>
  );
}
