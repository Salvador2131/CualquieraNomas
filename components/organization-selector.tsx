"use client";

import { useState } from "react";
import { useOrganization } from "@/lib/context/organization-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrganizationSelector() {
  const { organization, organizations, loading, switchOrganization } =
    useOrganization();
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === organization?.id) return;

    setSwitching(true);
    try {
      await switchOrganization(organizationId);
      // Recargar la página para actualizar todos los datos
      window.location.reload();
    } catch (error) {
      console.error("Error switching organization:", error);
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando organización...</span>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <Building2 className="h-4 w-4" />
        <span>No hay organización seleccionada</span>
      </div>
    );
  }

  // Si solo hay una organización, mostrar solo el nombre
  if (organizations.length === 1) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{organization.name}</span>
        <span className="text-xs text-muted-foreground">
          ({organization.plan})
        </span>
      </div>
    );
  }

  // Si hay múltiples organizaciones, mostrar selector
  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={organization.id}
        onValueChange={handleSwitch}
        disabled={switching}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            {switching ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Cambiando...</span>
              </div>
            ) : (
              organization.name
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex flex-col">
                <span>{org.name}</span>
                <span className="text-xs text-muted-foreground">
                  {org.plan}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
