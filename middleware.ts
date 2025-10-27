import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/", "/auth/login", "/preregister", "/gallery"];

  // Rutas que requieren autenticación
  const protectedRoutes = [
    "/dashboard",
    "/worker-dashboard",
    "/workers",
    "/employers",
    "/calendar",
    "/quote",
    "/messages",
    "/ratings",
    "/loyalty",
    "/settings",
  ];

  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verificar si la ruta actual es protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Si es una ruta protegida, verificar autenticación
  if (isProtectedRoute) {
    const userSession = request.cookies.get("user-session");

    if (!userSession) {
      // Redirigir al login si no hay sesión
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
      const sessionData = JSON.parse(userSession.value);

      // Validar que sessionData tenga la estructura correcta
      if (!sessionData || !sessionData.role) {
        console.warn("Invalid session data structure", { pathname });
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }

      // Verificar si el usuario tiene acceso a la ruta específica
      if (
        pathname.startsWith("/worker-dashboard") &&
        sessionData.role !== "worker"
      ) {
        // Si no es trabajador, redirigir al dashboard de admin
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (pathname.startsWith("/dashboard") && sessionData.role === "worker") {
        // Si es trabajador, redirigir al dashboard de trabajador
        return NextResponse.redirect(new URL("/worker-dashboard", request.url));
      }
    } catch (error) {
      // Si hay error al parsear la sesión, loguear y redirigir al login
      console.error("Session parsing error", { error, pathname });
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // Si es una ruta pública y el usuario ya está autenticado, redirigir según su rol
  if (isPublicRoute && pathname === "/auth/login") {
    const userSession = request.cookies.get("user-session");

    if (userSession) {
      try {
        const sessionData = JSON.parse(userSession.value);

        if (sessionData.role === "worker") {
          return NextResponse.redirect(
            new URL("/worker-dashboard", request.url)
          );
        } else {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch (error) {
        // Si hay error, continuar con la página de login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
