"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Certificate {
  id: string;
  certificate_type: string;
  certificate_name: string;
  certificate_file_url?: string;
  verified: boolean;
  verified_at?: string;
  ocr_data?: any;
  created_at: string;
  workers: {
    id: string;
    specialization: string;
    users: {
      id: string;
      name: string;
      email: string;
    };
  };
  verified_by?: {
    id: string;
    name: string;
  };
}

export default function SuperAdminCertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyReason, setVerifyReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/superadmin/certificates${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar certificados");
      }

      setCertificates(data.certificates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (verified: boolean) => {
    if (!selectedCertificate) return;

    setVerifying(true);
    setError("");

    try {
      const response = await fetch(
        `/api/superadmin/certificates/${selectedCertificate.id}/verify`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verified,
            reason: verifyReason || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al verificar certificado");
      }

      // Refrescar lista
      fetchCertificates();
      setIsVerifyDialogOpen(false);
      setSelectedCertificate(null);
      setVerifyReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando certificados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verificación de Certificados</h1>
          <p className="text-muted-foreground">
            Revisa y verifica los certificados subidos por trabajadores
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="verified">Verificados</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Certificates List */}
      {certificates.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay certificados{" "}
              {statusFilter === "pending" ? "pendientes" : ""} para verificar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificates.map((certificate) => (
            <Card key={certificate.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {certificate.certificate_name}
                      </h3>
                      {certificate.verified ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tipo</p>
                        <p className="font-medium">
                          {certificate.certificate_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Trabajador</p>
                        <p className="font-medium">
                          {certificate.workers?.users?.name || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {certificate.workers?.users?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Especialización</p>
                        <p className="font-medium">
                          {certificate.workers?.specialization || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha de Subida</p>
                        <p className="font-medium">
                          {new Date(
                            certificate.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {certificate.certificate_file_url && (
                      <div>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={certificate.certificate_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Archivo
                          </a>
                        </Button>
                      </div>
                    )}
                    {certificate.ocr_data && (
                      <div className="text-xs text-muted-foreground">
                        <p>Datos OCR extraídos:</p>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(certificate.ocr_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  {!certificate.verified && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCertificate(certificate);
                          setIsVerifyDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verificar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verify Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Certificado</DialogTitle>
            <DialogDescription>
              {selectedCertificate?.certificate_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Razón (Opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Notas sobre la verificación..."
                value={verifyReason}
                onChange={(e) => setVerifyReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleVerify(false)}
              disabled={verifying}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
            <Button
              type="button"
              onClick={() => handleVerify(true)}
              disabled={verifying}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {verifying ? "Verificando..." : "Aprobar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
