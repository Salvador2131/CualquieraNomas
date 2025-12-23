"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Certificate {
  id: string;
  certificate_type: string;
  certificate_name: string;
  certificate_file_url?: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: {
    id: string;
    name: string;
  };
  created_at: string;
}

const certificateTypes = [
  "Manipulación de Alimentos",
  "Primeros Auxilios",
  "Seguridad Laboral",
  "Coctelería",
  "Servicio de Mesa",
  "Otro",
];

export default function WorkerCertificatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    certificate_type: "",
    certificate_name: "",
    certificate_file_url: "",
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workers/certificates");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/workers/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al subir certificado");
      }

      // Refrescar lista
      fetchCertificates();
      setIsDialogOpen(false);
      setFormData({
        certificate_type: "",
        certificate_name: "",
        certificate_file_url: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (certificateId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este certificado?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/workers/certificates/${certificateId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al eliminar certificado");
      }

      // Refrescar lista
      fetchCertificates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const getStatusBadge = (certificate: Certificate) => {
    if (certificate.verified) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verificado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
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
          <h1 className="text-3xl font-bold">Mis Certificados</h1>
          <p className="text-muted-foreground">
            Gestiona tus certificados y documentos profesionales
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Subir Certificado
        </Button>
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
            <p className="text-muted-foreground mb-4">
              No tienes certificados subidos aún
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Subir Primer Certificado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificates.map((certificate) => (
            <Card key={certificate.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {certificate.certificate_name}
                      </h3>
                      {getStatusBadge(certificate)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tipo: {certificate.certificate_type}
                    </p>
                    {certificate.verified && certificate.verified_at && (
                      <p className="text-xs text-muted-foreground">
                        Verificado el{" "}
                        {new Date(certificate.verified_at).toLocaleDateString()}
                        {certificate.verified_by &&
                          ` por ${certificate.verified_by.name}`}
                      </p>
                    )}
                    {certificate.certificate_file_url && (
                      <a
                        href={certificate.certificate_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Ver archivo
                      </a>
                    )}
                  </div>
                  {!certificate.verified && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(certificate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Nuevo Certificado</DialogTitle>
            <DialogDescription>
              Sube un certificado o documento profesional para verificación
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="certificate_type">Tipo de Certificado *</Label>
                <Select
                  value={formData.certificate_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, certificate_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificateTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificate_name">
                  Nombre del Certificado *
                </Label>
                <Input
                  id="certificate_name"
                  placeholder="Ej: Certificado de Manipulación de Alimentos"
                  value={formData.certificate_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificate_name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificate_file_url">
                  URL del Archivo (Opcional)
                </Label>
                <Input
                  id="certificate_file_url"
                  type="url"
                  placeholder="https://ejemplo.com/certificado.pdf"
                  value={formData.certificate_file_url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificate_file_url: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Por ahora, puedes proporcionar una URL. En el futuro se podrá
                  subir archivos directamente.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Subiendo..." : "Subir Certificado"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
