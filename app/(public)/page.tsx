"use client";

import { useState } from "react";
import Link from "next/link";
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
  Calendar,
  Users,
  Star,
  Heart,
  Building2,
  Camera,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Briefcase,
} from "lucide-react";

const services = [
  {
    icon: Heart,
    title: "Bodas Elegantes",
    description: "Creamos bodas únicas e inolvidables con atención al detalle",
    features: [
      "Decoración personalizada",
      "Menú gourmet",
      "Coordinación completa",
    ],
  },
  {
    icon: Building2,
    title: "Eventos Corporativos",
    description: "Eventos profesionales que impresionan a tus clientes",
    features: [
      "Tecnología audiovisual",
      "Catering ejecutivo",
      "Logística profesional",
    ],
  },
  {
    icon: Users,
    title: "Fiestas Privadas",
    description: "Celebraciones especiales para momentos únicos",
    features: [
      "Temáticas personalizadas",
      "Entretenimiento",
      "Ambiente perfecto",
    ],
  },
];

const testimonials = [
  {
    name: "María González",
    event: "Boda",
    rating: 5,
    comment:
      "El servicio fue excepcional. Cada detalle fue perfecto y superó nuestras expectativas.",
  },
  {
    name: "Carlos Rodríguez",
    event: "Evento Corporativo",
    rating: 5,
    comment:
      "Profesionalismo y calidad excepcional. Nuestros clientes quedaron impresionados.",
  },
  {
    name: "Ana Martínez",
    event: "Quinceañera",
    rating: 5,
    comment:
      "Una experiencia mágica. El equipo hizo que el día fuera perfecto.",
  },
];

const stats = [
  { number: "500+", label: "Eventos Realizados" },
  { number: "98%", label: "Clientes Satisfechos" },
  { number: "15+", label: "Años de Experiencia" },
  { number: "24/7", label: "Soporte Disponible" },
];

export default function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">ERP Banquetes</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/gallery"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Galería
            </Link>
            <Link
              href="/preregister"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Solicitar Evento
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Acceder
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/preregister">Solicitar Cotización</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/login">
                <Briefcase className="h-4 w-4 mr-2" />
                Trabajar con Nosotros
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  <Star className="w-4 h-4 mr-2" />
                  Líderes en Eventos de Lujo
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                  Creamos
                  <span className="text-primary"> Experiencias</span>
                  <br />
                  Inolvidables
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Transformamos tus sueños en realidad con eventos únicos,
                  elegantes y perfectamente organizados.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/preregister">
                    Planificar Mi Evento
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/gallery">Ver Nuestros Trabajos</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-primary">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 p-8">
                <div className="h-full w-full rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                  <Camera className="h-24 w-24 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Nuestros Servicios
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ofrecemos una amplia gama de servicios para hacer de tu evento una
              experiencia única
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300"
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Lo Que Dicen Nuestros Clientes
            </h2>
            <p className="text-xl text-muted-foreground">
              Testimonios reales de eventos exitosos
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <blockquote className="text-lg italic mb-6">
                  "{testimonials[activeTestimonial].comment}"
                </blockquote>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {testimonials[activeTestimonial].name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonials[activeTestimonial].event}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeTestimonial ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-gradient-to-r from-primary to-secondary text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                ¿Listo para Planificar Tu Evento?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Contáctanos hoy y hagamos realidad tu evento perfecto
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/preregister">Solicitar Cotización</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  asChild
                >
                  <Link href="/gallery">Ver Galería</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">ERP Banquetes</span>
              </div>
              <p className="text-slate-300">
                Creamos experiencias inolvidables con más de 15 años de
                experiencia en el sector.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Servicios</h3>
              <ul className="space-y-2 text-slate-300">
                <li>Bodas</li>
                <li>Eventos Corporativos</li>
                <li>Fiestas Privadas</li>
                <li>Quinceañeras</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Enlaces</h3>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link
                    href="/gallery"
                    className="hover:text-primary transition-colors"
                  >
                    Galería
                  </Link>
                </li>
                <li>
                  <Link
                    href="/preregister"
                    className="hover:text-primary transition-colors"
                  >
                    Solicitar Evento
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/login"
                    className="hover:text-primary transition-colors"
                  >
                    Acceder
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Contacto</h3>
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>info@erpbanquetes.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Ciudad, País</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 ERP Banquetes. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
