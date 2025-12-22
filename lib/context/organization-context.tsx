"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  organizations: Organization[];
  loading: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  organizations: [],
  loading: true,
  switchOrganization: async () => {},
  refreshOrganizations: async () => {},
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchOrganizations = async (userId: string) => {
    try {
      // Obtener organizaciones del usuario desde la tabla users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user organization:", userError);
        return;
      }

      // Obtener la organización del usuario
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", userData.organization_id)
        .single();

      if (orgError || !orgData) {
        console.error("Error fetching organization:", orgError);
        return;
      }

      // Por ahora, un usuario solo tiene una organización
      // En el futuro se puede expandir para múltiples organizaciones
      setOrganizations([orgData]);
      setOrganization(orgData);

      // Guardar en localStorage
      localStorage.setItem("current_organization_id", orgData.id);
    } catch (error) {
      console.error("Error in fetchOrganizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrganizations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchOrganizations(session.user.id);
    }
  };

  const switchOrganization = async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .single();

      if (error || !data) {
        throw new Error("Organization not found");
      }

      setOrganization(data);
      localStorage.setItem("current_organization_id", organizationId);
    } catch (error) {
      console.error("Error switching organization:", error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeOrganization = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Intentar cargar desde localStorage primero
        const savedOrgId = localStorage.getItem("current_organization_id");
        
        if (savedOrgId) {
          try {
            const { data: orgData, error } = await supabase
              .from("organizations")
              .select("*")
              .eq("id", savedOrgId)
              .single();

            if (!error && orgData) {
              setOrganization(orgData);
              setOrganizations([orgData]);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error("Error loading saved organization:", error);
          }
        }

        // Si no hay organización guardada o hay error, obtener del usuario
        await fetchOrganizations(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initializeOrganization();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchOrganizations(session.user.id);
      } else {
        setOrganization(null);
        setOrganizations([]);
        localStorage.removeItem("current_organization_id");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizations,
        loading,
        switchOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
};
