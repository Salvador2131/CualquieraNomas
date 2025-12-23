import type React from "react";
import { Sidebar } from "@/components/sidebar";
import { OrganizationProvider } from "@/lib/context/organization-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrganizationProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </OrganizationProvider>
  );
}
